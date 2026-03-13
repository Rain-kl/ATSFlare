package service

import (
	"atsflare/common"
	"atsflare/model"
	"io"
	"net/http"
	"sort"
	"strings"
	"testing"
	"time"
)

type roundTripFunc func(req *http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func TestRequestNodeAgentPreviewUpdate(t *testing.T) {
	setupServiceTestDB(t)

	node, err := CreateNode(NodeInput{Name: "preview-edge-1"})
	if err != nil {
		t.Fatalf("failed to create node: %v", err)
	}

	originalClient := UpdateHTTPClientForTest()
	SetUpdateHTTPClientForTest(&http.Client{
		Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
			if req.URL.String() != "https://api.github.com/repos/"+common.AgentUpdateRepo+"/releases/tags/v0.5.0-rc.1" {
				t.Fatalf("unexpected request url: %s", req.URL.String())
			}
			return &http.Response{
				StatusCode: http.StatusOK,
				Header:     make(http.Header),
				Body:       io.NopCloser(strings.NewReader(`{"tag_name":"v0.5.0-rc.1","prerelease":true}`)),
			}, nil
		}),
	})
	t.Cleanup(func() {
		SetUpdateHTTPClientForTest(originalClient)
	})

	updated, err := RequestNodeAgentUpdate(node.ID, NodeAgentUpdateInput{
		Channel: "preview",
		TagName: "v0.5.0-rc.1",
	})
	if err != nil {
		t.Fatalf("expected preview update request to succeed: %v", err)
	}
	if !updated.UpdateRequested {
		t.Fatal("expected update_requested to be true")
	}
	if updated.UpdateChannel != "preview" {
		t.Fatalf("unexpected update channel: %s", updated.UpdateChannel)
	}
	if updated.UpdateTag != "v0.5.0-rc.1" {
		t.Fatalf("unexpected update tag: %s", updated.UpdateTag)
	}
}

func TestHeartbeatNodeReturnsPreviewUpdateSettings(t *testing.T) {
	setupServiceTestDB(t)

	node := &model.Node{
		NodeID:                    "node-preview-1",
		Name:                      "preview-edge-1",
		IP:                        "10.0.0.8",
		AgentToken:                "agent-token",
		AgentVersion:              "v0.4.0",
		NginxVersion:              "1.27.1.2",
		Status:                    NodeStatusOnline,
		UpdateRequested:           true,
		UpdateChannel:             "preview",
		UpdateTag:                 "v0.5.0-rc.1",
		RestartOpenrestyRequested: true,
		AutoUpdateEnabled:         false,
	}
	if err := node.Insert(); err != nil {
		t.Fatalf("failed to seed node: %v", err)
	}
	if err := model.DB.Create(&model.ConfigVersion{
		Version:        "20260313-001",
		SnapshotJSON:   "{}",
		MainConfig:     "worker_processes auto;",
		RenderedConfig: "server { listen 80; }",
		Checksum:       "checksum-active-1",
		IsActive:       true,
		CreatedBy:      "root",
	}).Error; err != nil {
		t.Fatalf("failed to seed active config version: %v", err)
	}

	resp, err := HeartbeatNode(node, AgentNodePayload{
		NodeID:           node.NodeID,
		Name:             node.Name,
		IP:               node.IP,
		AgentVersion:     node.AgentVersion,
		NginxVersion:     node.NginxVersion,
		OpenrestyStatus:  OpenrestyStatusUnhealthy,
		OpenrestyMessage: "port 80 already allocated",
	})
	if err != nil {
		t.Fatalf("expected heartbeat to succeed: %v", err)
	}
	if resp.AgentSettings == nil {
		t.Fatal("expected agent settings in heartbeat response")
	}
	if resp.ActiveConfig == nil {
		t.Fatal("expected active config summary in heartbeat response")
	}
	if resp.ActiveConfig.Version == "" || resp.ActiveConfig.Checksum == "" {
		t.Fatal("expected active config summary to include version and checksum")
	}
	if !resp.AgentSettings.UpdateNow {
		t.Fatal("expected update_now to be true")
	}
	if resp.AgentSettings.UpdateChannel != "preview" {
		t.Fatalf("unexpected update channel: %s", resp.AgentSettings.UpdateChannel)
	}
	if resp.AgentSettings.UpdateTag != "v0.5.0-rc.1" {
		t.Fatalf("unexpected update tag: %s", resp.AgentSettings.UpdateTag)
	}
	if !resp.AgentSettings.RestartOpenrestyNow {
		t.Fatal("expected restart_openresty_now to be true")
	}
	if resp.Node.OpenrestyStatus != OpenrestyStatusUnhealthy {
		t.Fatalf("expected unhealthy openresty status, got %s", resp.Node.OpenrestyStatus)
	}
	if resp.Node.OpenrestyMessage != "port 80 already allocated" {
		t.Fatalf("unexpected openresty message: %s", resp.Node.OpenrestyMessage)
	}

	storedNode, err := model.GetNodeByID(node.ID)
	if err != nil {
		t.Fatalf("failed to reload node: %v", err)
	}
	if storedNode.UpdateRequested {
		t.Fatal("expected update_requested to be reset after heartbeat")
	}
	if storedNode.UpdateChannel != "stable" {
		t.Fatalf("expected update channel to reset to stable, got %s", storedNode.UpdateChannel)
	}
	if storedNode.UpdateTag != "" {
		t.Fatalf("expected update tag to be cleared, got %s", storedNode.UpdateTag)
	}
	if storedNode.RestartOpenrestyRequested {
		t.Fatal("expected restart_openresty_requested to be reset after heartbeat")
	}
}

func TestRequestNodeOpenrestyRestart(t *testing.T) {
	setupServiceTestDB(t)

	node, err := CreateNode(NodeInput{Name: "restart-edge-1"})
	if err != nil {
		t.Fatalf("failed to create node: %v", err)
	}

	updated, err := RequestNodeOpenrestyRestart(node.ID)
	if err != nil {
		t.Fatalf("expected openresty restart request to succeed: %v", err)
	}
	if !updated.RestartOpenrestyRequested {
		t.Fatal("expected restart_openresty_requested to be true")
	}
}

func TestListNodeViewsIncludesLatestApplyLogsForMultipleNodes(t *testing.T) {
	setupServiceTestDB(t)

	now := time.Now()
	nodes := []*model.Node{
		{
			NodeID:       "node-a",
			Name:         "edge-a",
			IP:           "10.0.0.11",
			AgentToken:   "token-a",
			AgentVersion: "v0.5.0",
			NginxVersion: "1.27.1.2",
			Status:       NodeStatusOnline,
			LastSeenAt:   now,
		},
		{
			NodeID:       "node-b",
			Name:         "edge-b",
			IP:           "10.0.0.12",
			AgentToken:   "token-b",
			AgentVersion: "v0.5.0",
			NginxVersion: "1.27.1.2",
			Status:       NodeStatusOnline,
			LastSeenAt:   now,
		},
	}
	for _, node := range nodes {
		if err := node.Insert(); err != nil {
			t.Fatalf("failed to insert node %s: %v", node.NodeID, err)
		}
	}

	logs := []*model.ApplyLog{
		{NodeID: "node-a", Version: "20260313-001", Result: ApplyResultOK, Message: "first success", CreatedAt: now.Add(-2 * time.Minute)},
		{NodeID: "node-a", Version: "20260313-002", Result: ApplyResultFailed, Message: "latest failure", CreatedAt: now.Add(-1 * time.Minute)},
		{NodeID: "node-b", Version: "20260313-003", Result: ApplyResultOK, Message: "latest success", CreatedAt: now},
	}
	for _, log := range logs {
		if err := model.DB.Create(log).Error; err != nil {
			t.Fatalf("failed to insert apply log for %s: %v", log.NodeID, err)
		}
	}

	views, err := ListNodeViews()
	if err != nil {
		t.Fatalf("ListNodeViews failed: %v", err)
	}
	if len(views) != 2 {
		t.Fatalf("expected 2 node views, got %d", len(views))
	}

	sort.Slice(views, func(i int, j int) bool {
		return views[i].NodeID < views[j].NodeID
	})

	if views[0].NodeID != "node-a" || views[0].LatestApplyResult != ApplyResultFailed || views[0].LatestApplyMessage != "latest failure" {
		t.Fatalf("unexpected latest apply log for node-a: %+v", views[0])
	}
	if views[1].NodeID != "node-b" || views[1].LatestApplyResult != ApplyResultOK || views[1].LatestApplyMessage != "latest success" {
		t.Fatalf("unexpected latest apply log for node-b: %+v", views[1])
	}
}

func TestCollectNodeHeartbeatChangesOnlyReturnsChangedFields(t *testing.T) {
	now := time.Now()
	before := &model.Node{
		Name:                      "edge-1",
		IP:                        "10.0.0.8",
		AgentVersion:              "v0.5.0",
		NginxVersion:              "1.27.1.2",
		OpenrestyStatus:           OpenrestyStatusHealthy,
		OpenrestyMessage:          "",
		Status:                    NodeStatusOnline,
		CurrentVersion:            "20260313-001",
		LastSeenAt:                now.Add(-time.Minute),
		LastError:                 "",
		UpdateRequested:           true,
		UpdateChannel:             "preview",
		UpdateTag:                 "v0.5.0-rc.1",
		RestartOpenrestyRequested: true,
	}
	after := &model.Node{
		Name:                      "edge-1",
		IP:                        "10.0.0.8",
		AgentVersion:              "v0.5.0",
		NginxVersion:              "1.27.1.2",
		OpenrestyStatus:           OpenrestyStatusHealthy,
		OpenrestyMessage:          "",
		Status:                    NodeStatusOnline,
		CurrentVersion:            "20260313-001",
		LastSeenAt:                now,
		LastError:                 "",
		UpdateRequested:           false,
		UpdateChannel:             "stable",
		UpdateTag:                 "",
		RestartOpenrestyRequested: false,
	}

	changes := collectNodeHeartbeatChanges(before, after)
	if len(changes) != 5 {
		t.Fatalf("expected 5 changed fields, got %d: %#v", len(changes), changes)
	}
	if _, ok := changes["last_seen_at"]; !ok {
		t.Fatal("expected last_seen_at change to be included")
	}
	if value, ok := changes["update_requested"]; !ok || value != false {
		t.Fatalf("expected update_requested reset, got %#v", value)
	}
	if value, ok := changes["update_channel"]; !ok || value != "stable" {
		t.Fatalf("expected update_channel reset, got %#v", value)
	}
	if value, ok := changes["update_tag"]; !ok || value != "" {
		t.Fatalf("expected update_tag reset, got %#v", value)
	}
	if value, ok := changes["restart_openresty_requested"]; !ok || value != false {
		t.Fatalf("expected restart_openresty_requested reset, got %#v", value)
	}
	if _, ok := changes["ip"]; ok {
		t.Fatal("did not expect unchanged ip to be included")
	}
}

func TestListNodeViewsDoesNotPersistComputedStatus(t *testing.T) {
	setupServiceTestDB(t)

	node := &model.Node{
		NodeID:       "node-offline-view",
		Name:         "edge-offline",
		IP:           "10.0.0.21",
		AgentToken:   "token-offline",
		AgentVersion: "v0.5.0",
		NginxVersion: "1.27.1.2",
		Status:       NodeStatusOnline,
		LastSeenAt:   time.Now().Add(-common.NodeOfflineThreshold - time.Minute),
	}
	if err := node.Insert(); err != nil {
		t.Fatalf("failed to insert node: %v", err)
	}

	views, err := ListNodeViews()
	if err != nil {
		t.Fatalf("ListNodeViews failed: %v", err)
	}
	if len(views) != 1 {
		t.Fatalf("expected 1 node view, got %d", len(views))
	}
	if views[0].Status != NodeStatusOffline {
		t.Fatalf("expected computed offline status in view, got %s", views[0].Status)
	}

	storedNode, err := model.GetNodeByID(node.ID)
	if err != nil {
		t.Fatalf("failed to reload node: %v", err)
	}
	if storedNode.Status != NodeStatusOnline {
		t.Fatalf("expected list query to avoid persisting computed status, got %s", storedNode.Status)
	}
}
