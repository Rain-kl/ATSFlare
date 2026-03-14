package observability

import (
	"atsflare-agent/internal/config"
	"atsflare-agent/internal/protocol"
	"atsflare-agent/internal/state"
	"bufio"
	"encoding/json"
	"errors"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

type accessLogRecord struct {
	Timestamp  string `json:"ts"`
	Host       string `json:"host"`
	RemoteAddr string `json:"remote_addr"`
	Status     int    `json:"status"`
}

type trafficAggregate struct {
	windowStartedAt time.Time
	windowEndedAt   time.Time
	requestCount    int64
	errorCount      int64
	statusCodes     map[string]int64
	topDomains      map[string]int64
	visitors        map[string]struct{}
}

func BuildTrafficReport(cfg *config.Config, stateStore *state.Store) *protocol.NodeTrafficReport {
	if cfg == nil || stateStore == nil {
		return nil
	}

	snapshot, err := stateStore.Load()
	if err != nil {
		return nil
	}

	logPath := managedAccessLogPath(cfg)
	file, err := os.Open(logPath)
	if err != nil {
		if os.IsNotExist(err) {
			if snapshot.AccessLogOffset != 0 {
				snapshot.AccessLogOffset = 0
				_ = stateStore.Save(snapshot)
			}
			return nil
		}
		return nil
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		return nil
	}

	offset := snapshot.AccessLogOffset
	if offset < 0 || offset > info.Size() {
		offset = 0
	}
	if _, err = file.Seek(offset, io.SeekStart); err != nil {
		return nil
	}

	reader := bufio.NewReader(file)
	currentOffset := offset
	aggregate := newTrafficAggregate()

	for {
		line, readErr := reader.ReadBytes('\n')
		if len(line) > 0 {
			currentOffset += int64(len(line))
			aggregate.consume(line)
		}
		if errors.Is(readErr, io.EOF) {
			break
		}
		if readErr != nil {
			return nil
		}
	}

	snapshot.AccessLogOffset = currentOffset
	_ = stateStore.Save(snapshot)

	return aggregate.report()
}

func managedAccessLogPath(cfg *config.Config) string {
	if cfg == nil || strings.TrimSpace(cfg.RouteConfigPath) == "" {
		return ""
	}
	return filepath.Join(filepath.Dir(cfg.RouteConfigPath), "atsflare_access.log")
}

func newTrafficAggregate() *trafficAggregate {
	return &trafficAggregate{
		statusCodes: make(map[string]int64),
		topDomains:  make(map[string]int64),
		visitors:    make(map[string]struct{}),
	}
}

func (aggregate *trafficAggregate) consume(line []byte) {
	trimmed := strings.TrimSpace(string(line))
	if trimmed == "" {
		return
	}

	var record accessLogRecord
	if err := json.Unmarshal([]byte(trimmed), &record); err != nil {
		return
	}

	timestamp, err := parseAccessLogTime(record.Timestamp)
	if err != nil {
		return
	}

	if aggregate.windowStartedAt.IsZero() || timestamp.Before(aggregate.windowStartedAt) {
		aggregate.windowStartedAt = timestamp
	}
	if aggregate.windowEndedAt.IsZero() || timestamp.After(aggregate.windowEndedAt) {
		aggregate.windowEndedAt = timestamp
	}

	aggregate.requestCount++
	if record.Status >= 500 {
		aggregate.errorCount++
	}
	if record.Status > 0 {
		aggregate.statusCodes[strconv.Itoa(record.Status)]++
	}
	if host := strings.TrimSpace(record.Host); host != "" {
		aggregate.topDomains[host]++
	}
	if remoteAddr := strings.TrimSpace(record.RemoteAddr); remoteAddr != "" {
		aggregate.visitors[remoteAddr] = struct{}{}
	}
}

func (aggregate *trafficAggregate) report() *protocol.NodeTrafficReport {
	if aggregate.requestCount == 0 || aggregate.windowStartedAt.IsZero() || aggregate.windowEndedAt.IsZero() {
		return nil
	}

	return &protocol.NodeTrafficReport{
		WindowStartedAtUnix: aggregate.windowStartedAt.Unix(),
		WindowEndedAtUnix:   aggregate.windowEndedAt.Unix(),
		RequestCount:        aggregate.requestCount,
		ErrorCount:          aggregate.errorCount,
		UniqueVisitorCount:  int64(len(aggregate.visitors)),
		StatusCodes:         cloneTrafficCounts(aggregate.statusCodes, 0),
		TopDomains:          topCounts(aggregate.topDomains, 8),
		SourceCountries:     map[string]int64{},
	}
}

func parseAccessLogTime(value string) (time.Time, error) {
	return time.Parse(time.RFC3339, strings.TrimSpace(value))
}

func cloneTrafficCounts(values map[string]int64, limit int) map[string]int64 {
	if len(values) == 0 {
		return map[string]int64{}
	}
	items := make([]trafficCountItem, 0, len(values))
	for key, value := range values {
		items = append(items, trafficCountItem{key: key, value: value})
	}
	sort.Slice(items, func(i int, j int) bool {
		if items[i].value == items[j].value {
			return items[i].key < items[j].key
		}
		return items[i].value > items[j].value
	})
	if limit > 0 && len(items) > limit {
		items = items[:limit]
	}
	result := make(map[string]int64, len(items))
	for _, item := range items {
		result[item.key] = item.value
	}
	return result
}

type trafficCountItem struct {
	key   string
	value int64
}

func topCounts(values map[string]int64, limit int) map[string]int64 {
	return cloneTrafficCounts(values, limit)
}
