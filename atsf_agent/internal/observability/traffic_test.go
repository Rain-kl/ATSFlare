package observability

import (
	"os"
	"path/filepath"
	"testing"

	"atsflare-agent/internal/config"
	"atsflare-agent/internal/state"
)

func TestBuildTrafficReportAggregatesManagedAccessLog(t *testing.T) {
	tempDir := t.TempDir()
	routeConfigPath := filepath.Join(tempDir, "conf.d", "atsflare_routes.conf")
	if err := os.MkdirAll(filepath.Dir(routeConfigPath), 0o755); err != nil {
		t.Fatalf("MkdirAll failed: %v", err)
	}
	logPath := filepath.Join(filepath.Dir(routeConfigPath), "atsflare_access.log")
	content := []byte(
		"{\"ts\":\"2026-03-14T08:00:00Z\",\"host\":\"app.example.com\",\"remote_addr\":\"10.0.0.1\",\"status\":200}\n" +
			"{\"ts\":\"2026-03-14T08:00:05Z\",\"host\":\"app.example.com\",\"remote_addr\":\"10.0.0.2\",\"status\":503}\n" +
			"{\"ts\":\"2026-03-14T08:00:08Z\",\"host\":\"api.example.com\",\"remote_addr\":\"10.0.0.1\",\"status\":200}\n",
	)
	if err := os.WriteFile(logPath, content, 0o644); err != nil {
		t.Fatalf("WriteFile failed: %v", err)
	}

	stateStore := state.NewStore(filepath.Join(tempDir, "state.json"))
	report := BuildTrafficReport(&config.Config{RouteConfigPath: routeConfigPath}, stateStore)
	if report == nil {
		t.Fatal("expected traffic report")
	}
	if report.RequestCount != 3 || report.ErrorCount != 1 || report.UniqueVisitorCount != 2 {
		t.Fatalf("unexpected traffic report counters: %+v", report)
	}
	if report.StatusCodes["200"] != 2 || report.StatusCodes["503"] != 1 {
		t.Fatalf("unexpected status codes: %+v", report.StatusCodes)
	}
	if report.TopDomains["app.example.com"] != 2 || report.TopDomains["api.example.com"] != 1 {
		t.Fatalf("unexpected top domains: %+v", report.TopDomains)
	}

	snapshot, err := stateStore.Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if snapshot.AccessLogOffset != int64(len(content)) {
		t.Fatalf("unexpected access log offset: %d", snapshot.AccessLogOffset)
	}

	secondReport := BuildTrafficReport(&config.Config{RouteConfigPath: routeConfigPath}, stateStore)
	if secondReport != nil {
		t.Fatalf("expected no report without appended lines, got %+v", secondReport)
	}
}

func TestBuildTrafficReportResetsOffsetAfterTruncate(t *testing.T) {
	tempDir := t.TempDir()
	routeConfigPath := filepath.Join(tempDir, "conf.d", "atsflare_routes.conf")
	if err := os.MkdirAll(filepath.Dir(routeConfigPath), 0o755); err != nil {
		t.Fatalf("MkdirAll failed: %v", err)
	}
	logPath := filepath.Join(filepath.Dir(routeConfigPath), "atsflare_access.log")
	if err := os.WriteFile(logPath, []byte("{\"ts\":\"2026-03-14T09:00:00Z\",\"host\":\"app.example.com\",\"remote_addr\":\"10.0.0.3\",\"status\":200}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile failed: %v", err)
	}

	stateStore := state.NewStore(filepath.Join(tempDir, "state.json"))
	if err := stateStore.Save(&state.Snapshot{AccessLogOffset: 4096}); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	report := BuildTrafficReport(&config.Config{RouteConfigPath: routeConfigPath}, stateStore)
	if report == nil || report.RequestCount != 1 {
		t.Fatalf("expected one request after truncate reset, got %+v", report)
	}
}
