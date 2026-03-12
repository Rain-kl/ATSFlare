package service

import (
	"atsflare/common"
	"bytes"
	"context"
	"os"
	"runtime"
	"testing"
	"time"
)

func resetServerUpgradeTestState(t *testing.T) {
	t.Helper()
	serverUpgradeState.Lock()
	serverUpgradeState.inProgress = false
	serverUpgradeState.Unlock()
	manualServerBinaryState.Lock()
	cleanupManualServerBinaryCandidateLocked()
	manualServerBinaryState.Unlock()
}

func fakeServerBinaryFixture(version string) (string, []byte) {
	if runtime.GOOS == "windows" {
		return "atsflare-server-test.cmd", []byte("@echo off\r\necho " + version + "\r\n")
	}
	return "atsflare-server-test.sh", []byte("#!/bin/sh\necho " + version + "\n")
}

func TestIsVersionNewer(t *testing.T) {
	testCases := []struct {
		name     string
		current  string
		latest   string
		expected bool
	}{
		{name: "newer patch", current: "v1.2.3", latest: "v1.2.4", expected: true},
		{name: "same version", current: "v1.2.3", latest: "v1.2.3", expected: false},
		{name: "older remote", current: "v1.3.0", latest: "v1.2.9", expected: false},
		{name: "double digit segment", current: "v1.9.9", latest: "v1.10.0", expected: true},
		{name: "stable newer than prerelease", current: "v1.2.3-rc.1", latest: "v1.2.3", expected: true},
		{name: "prerelease not newer than same stable", current: "v1.2.3", latest: "v1.2.3-rc.1", expected: false},
		{name: "newer prerelease sequence", current: "v1.2.3-rc.1", latest: "v1.2.3-rc.2", expected: true},
		{name: "dev build", current: "dev", latest: "v0.4.0", expected: true},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			actual := isVersionNewer(testCase.current, testCase.latest)
			if actual != testCase.expected {
				t.Fatalf("unexpected compare result: current=%s latest=%s actual=%v expected=%v", testCase.current, testCase.latest, actual, testCase.expected)
			}
		})
	}
}

func TestBuildLatestServerReleaseView(t *testing.T) {
	originalVersion := common.Version
	common.Version = "v0.4.0"
	t.Cleanup(func() {
		common.Version = originalVersion
		serverUpgradeState.Lock()
		serverUpgradeState.inProgress = false
		serverUpgradeState.Unlock()
	})

	serverUpgradeState.Lock()
	serverUpgradeState.inProgress = true
	serverUpgradeState.Unlock()

	view := buildLatestServerReleaseView(&githubReleaseResponse{
		TagName:     "v0.5.0",
		Body:        "release notes",
		HTMLURL:     "https://github.com/Rain-kl/ATSFlare/releases/tag/v0.5.0",
		PublishedAt: "2026-03-11T00:00:00Z",
	}, ReleaseChannelStable)

	if view.CurrentVersion != "v0.4.0" {
		t.Fatalf("unexpected current version: %s", view.CurrentVersion)
	}
	if !view.HasUpdate {
		t.Fatal("expected has_update to be true")
	}
	if !view.InProgress {
		t.Fatal("expected in_progress to reflect upgrade state")
	}
	if view.TagName != "v0.5.0" {
		t.Fatalf("unexpected tag name: %s", view.TagName)
	}
	if view.Channel != ReleaseChannelStable.String() {
		t.Fatalf("unexpected channel: %s", view.Channel)
	}
}

func TestBuildLatestServerReleaseViewDevBuild(t *testing.T) {
	originalVersion := common.Version
	common.Version = "dev"
	t.Cleanup(func() {
		common.Version = originalVersion
		serverUpgradeState.Lock()
		serverUpgradeState.inProgress = false
		serverUpgradeState.Unlock()
	})

	view := buildLatestServerReleaseView(&githubReleaseResponse{
		TagName: "v0.5.0",
	}, ReleaseChannelStable)

	if view.HasUpdate {
		t.Fatal("expected dev build not to report update availability")
	}
	if view.UpgradeSupported {
		t.Fatal("expected dev build not to support self-upgrade")
	}
}

func TestBuildLatestServerReleaseViewPreview(t *testing.T) {
	originalVersion := common.Version
	common.Version = "v0.5.0-rc.1"
	t.Cleanup(func() {
		common.Version = originalVersion
		resetServerUpgradeTestState(t)
	})

	view := buildLatestServerReleaseView(&githubReleaseResponse{
		TagName:     "v0.5.0-rc.2",
		Prerelease:  true,
		PublishedAt: "2026-03-12T00:00:00Z",
	}, ReleaseChannelPreview)

	if !view.HasUpdate {
		t.Fatal("expected preview release to be newer")
	}
	if !view.Prerelease {
		t.Fatal("expected preview flag to be true")
	}
	if view.Channel != ReleaseChannelPreview.String() {
		t.Fatalf("unexpected channel: %s", view.Channel)
	}
}

func TestUploadManualServerBinary(t *testing.T) {
	originalVersion := common.Version
	common.Version = "v0.4.0"
	t.Cleanup(func() {
		common.Version = originalVersion
		resetServerUpgradeTestState(t)
	})

	fileName, content := fakeServerBinaryFixture("v0.5.0")
	info, err := UploadManualServerBinary(context.Background(), fileName, bytes.NewReader(content))
	if err != nil {
		t.Fatalf("expected upload to succeed: %v", err)
	}
	if !info.ReadyToUpgrade {
		t.Fatal("expected uploaded binary to be ready for upgrade")
	}
	if info.UploadToken == "" {
		t.Fatal("expected upload token to be returned")
	}
	if info.DetectedVersion != "v0.5.0" {
		t.Fatalf("unexpected detected version: %s", info.DetectedVersion)
	}

	manualServerBinaryState.Lock()
	candidate := manualServerBinaryState.candidate
	manualServerBinaryState.Unlock()
	if candidate == nil {
		t.Fatal("expected manual upgrade candidate to be stored")
	}
	if _, err := os.Stat(candidate.TempPath); err != nil {
		t.Fatalf("expected temporary binary to exist: %v", err)
	}
	if candidate.UploadToken != info.UploadToken {
		t.Fatalf("unexpected stored upload token: %s", candidate.UploadToken)
	}
}

func TestUploadManualServerBinaryRejectsSameVersion(t *testing.T) {
	originalVersion := common.Version
	common.Version = "v0.5.0"
	t.Cleanup(func() {
		common.Version = originalVersion
		resetServerUpgradeTestState(t)
	})

	fileName, content := fakeServerBinaryFixture("v0.5.0")
	info, err := UploadManualServerBinary(context.Background(), fileName, bytes.NewReader(content))
	if err != nil {
		t.Fatalf("expected upload to succeed: %v", err)
	}
	if info.ReadyToUpgrade {
		t.Fatal("expected same-version upload not to be upgradeable")
	}
	if info.UploadToken != "" {
		t.Fatal("expected same-version upload not to issue a token")
	}

	manualServerBinaryState.Lock()
	defer manualServerBinaryState.Unlock()
	if manualServerBinaryState.candidate != nil {
		t.Fatal("expected no pending manual upgrade candidate")
	}
}

func TestConfirmManualServerUpgrade(t *testing.T) {
	originalVersion := common.Version
	originalExecutor := ServerBinaryUpgradeExecutorForTest()
	originalDelay := ServerUpgradeDispatchDelayForTest()
	common.Version = "v0.4.0"
	called := make(chan string, 1)
	SetServerBinaryUpgradeExecutorForTest(func(execPath string, tempPath string) error {
		called <- tempPath
		return nil
	})
	SetServerUpgradeDispatchDelayForTest(0)
	t.Cleanup(func() {
		common.Version = originalVersion
		SetServerBinaryUpgradeExecutorForTest(originalExecutor)
		SetServerUpgradeDispatchDelayForTest(originalDelay)
		resetServerUpgradeTestState(t)
	})

	fileName, content := fakeServerBinaryFixture("v0.5.0")
	info, err := UploadManualServerBinary(context.Background(), fileName, bytes.NewReader(content))
	if err != nil {
		t.Fatalf("expected upload to succeed: %v", err)
	}

	confirmed, err := ConfirmManualServerUpgrade(info.UploadToken)
	if err != nil {
		t.Fatalf("expected confirm to succeed: %v", err)
	}
	if confirmed.UploadToken != info.UploadToken {
		t.Fatalf("unexpected confirmed upload token: %s", confirmed.UploadToken)
	}

	select {
	case tempPath := <-called:
		if tempPath == "" {
			t.Fatal("expected upgrade executor to receive temp path")
		}
	case <-time.After(time.Second):
		t.Fatal("expected manual upgrade executor to be called")
	}
}
