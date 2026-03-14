package service

import (
	"atsflare/model"
	"strings"
	"time"
)

const accessLogListLimit = 500

type AccessLogView struct {
	ID         uint      `json:"id"`
	NodeID     string    `json:"node_id"`
	NodeName   string    `json:"node_name"`
	LoggedAt   time.Time `json:"logged_at"`
	RemoteAddr string    `json:"remote_addr"`
	Host       string    `json:"host"`
	Path       string    `json:"path"`
	StatusCode int       `json:"status_code"`
}

func ListAccessLogs(nodeID string) ([]AccessLogView, error) {
	logs, err := model.ListNodeAccessLogs(strings.TrimSpace(nodeID), time.Now().Add(-nodeAccessLogRetentionWindow), accessLogListLimit)
	if err != nil {
		return nil, err
	}
	nodes, err := model.ListNodes()
	if err != nil {
		return nil, err
	}
	nodeNames := make(map[string]string, len(nodes))
	for _, node := range nodes {
		if node == nil {
			continue
		}
		nodeNames[node.NodeID] = node.Name
	}
	views := make([]AccessLogView, 0, len(logs))
	for _, item := range logs {
		if item == nil {
			continue
		}
		views = append(views, AccessLogView{
			ID:         item.ID,
			NodeID:     item.NodeID,
			NodeName:   nodeNames[item.NodeID],
			LoggedAt:   item.LoggedAt,
			RemoteAddr: item.RemoteAddr,
			Host:       item.Host,
			Path:       item.Path,
			StatusCode: item.StatusCode,
		})
	}
	return views, nil
}
