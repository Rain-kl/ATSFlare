package updater

import (
	"atsflare-agent/internal/agent"
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
)

type roundTripFunc func(req *http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func TestGetLatestPreviewRelease(t *testing.T) {
	service := &Service{
		httpClient: &http.Client{
			Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
				if req.URL.String() != "https://api.github.com/repos/Rain-kl/ATSFlare/releases?per_page=20" {
					t.Fatalf("unexpected request url: %s", req.URL.String())
				}
				return &http.Response{
					StatusCode: http.StatusOK,
					Header:     make(http.Header),
					Body: io.NopCloser(strings.NewReader(`[
						{"tag_name":"v1.0.0","prerelease":false},
						{"tag_name":"v1.1.0-rc.1","prerelease":true}
					]`)),
				}, nil
			}),
		},
	}

	release, err := service.getRelease(context.Background(), "Rain-kl/ATSFlare", agent.UpdateOptions{Channel: "preview"})
	if err != nil {
		t.Fatalf("expected preview release query to succeed: %v", err)
	}
	if release == nil || release.TagName != "v1.1.0-rc.1" {
		t.Fatalf("unexpected preview release: %#v", release)
	}
}

func TestGetReleaseByTag(t *testing.T) {
	service := &Service{
		httpClient: &http.Client{
			Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
				if req.URL.String() != "https://api.github.com/repos/Rain-kl/ATSFlare/releases/tags/v1.1.0-rc.1" {
					t.Fatalf("unexpected request url: %s", req.URL.String())
				}
				return &http.Response{
					StatusCode: http.StatusOK,
					Header:     make(http.Header),
					Body:       io.NopCloser(strings.NewReader(`{"tag_name":"v1.1.0-rc.1","prerelease":true}`)),
				}, nil
			}),
		},
	}

	release, err := service.getRelease(context.Background(), "Rain-kl/ATSFlare", agent.UpdateOptions{Channel: "preview", TagName: "v1.1.0-rc.1", Force: true})
	if err != nil {
		t.Fatalf("expected tag release query to succeed: %v", err)
	}
	if release == nil || release.TagName != "v1.1.0-rc.1" {
		t.Fatalf("unexpected tag release: %#v", release)
	}
}

func TestIsNewerSupportsPrerelease(t *testing.T) {
	testCases := []struct {
		name     string
		local    string
		remote   string
		expected bool
	}{
		{name: "stable newer than prerelease", local: "1.2.3-rc.1", remote: "1.2.3", expected: true},
		{name: "same stable not newer", local: "1.2.3", remote: "1.2.3-rc.1", expected: false},
		{name: "higher prerelease sequence", local: "1.2.3-rc.1", remote: "1.2.3-rc.2", expected: true},
		{name: "higher minor", local: "1.2.3", remote: "1.3.0-rc.1", expected: true},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			if actual := isNewer(testCase.local, testCase.remote); actual != testCase.expected {
				t.Fatalf("unexpected compare result: local=%s remote=%s actual=%v expected=%v", testCase.local, testCase.remote, actual, testCase.expected)
			}
		})
	}
}
