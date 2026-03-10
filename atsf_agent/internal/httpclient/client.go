package httpclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"atsflare-agent/internal/protocol"
)

type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

func New(baseURL string, token string, timeout time.Duration) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		token:   token,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

func (c *Client) RegisterNode(ctx context.Context, payload protocol.NodePayload) error {
	log.Printf("http register node request: node_id=%s current_version=%s", payload.NodeID, payload.CurrentVersion)
	return c.postJSON(ctx, "/api/agent/nodes/register", payload, nil)
}

func (c *Client) Heartbeat(ctx context.Context, payload protocol.NodePayload) error {
	return c.postJSON(ctx, "/api/agent/nodes/heartbeat", payload, nil)
}

func (c *Client) GetActiveConfig(ctx context.Context) (*protocol.ActiveConfigResponse, error) {
	log.Printf("http get active config request")
	resp := protocol.APIResponse[protocol.ActiveConfigResponse]{}
	if err := c.getJSON(ctx, "/api/agent/config-versions/active", &resp); err != nil {
		return nil, err
	}
	if !resp.Success {
		return nil, errors.New(resp.Message)
	}
	log.Printf("http get active config response: version=%s checksum=%s support_files=%d", resp.Data.Version, resp.Data.Checksum, len(resp.Data.SupportFiles))
	return &resp.Data, nil
}

func (c *Client) ReportApplyLog(ctx context.Context, payload protocol.ApplyLogPayload) error {
	log.Printf("http report apply log request: node_id=%s version=%s result=%s", payload.NodeID, payload.Version, payload.Result)
	return c.postJSON(ctx, "/api/agent/apply-logs", payload, nil)
}

func (c *Client) getJSON(ctx context.Context, path string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return err
	}
	req.Header.Set("X-Agent-Token", c.token)
	return c.do(req, target)
}

func (c *Client) postJSON(ctx context.Context, path string, body any, target any) error {
	data, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-Token", c.token)
	return c.do(req, target)
}

func (c *Client) do(req *http.Request, target any) error {
	if !isHeartbeatRequest(req) {
		log.Printf("http request start: method=%s path=%s", req.Method, req.URL.Path)
	}
	res, err := c.httpClient.Do(req)
	if err != nil {
		log.Printf("http request failed: method=%s path=%s error=%v", req.Method, req.URL.Path, err)
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		log.Printf("http request returned non-200: method=%s path=%s status=%s", req.Method, req.URL.Path, res.Status)
		return errors.New(res.Status)
	}
	if target == nil {
		var wrapper protocol.APIResponse[json.RawMessage]
		if err = json.NewDecoder(res.Body).Decode(&wrapper); err != nil {
			log.Printf("http response decode failed: method=%s path=%s error=%v", req.Method, req.URL.Path, err)
			return err
		}
		if !wrapper.Success {
			log.Printf("http api response failed: method=%s path=%s message=%s", req.Method, req.URL.Path, wrapper.Message)
			return errors.New(wrapper.Message)
		}
		if !isHeartbeatRequest(req) {
			log.Printf("http request succeeded: method=%s path=%s", req.Method, req.URL.Path)
		}
		return nil
	}
	if err = json.NewDecoder(res.Body).Decode(target); err != nil {
		log.Printf("http response decode failed: method=%s path=%s error=%v", req.Method, req.URL.Path, err)
		return err
	}
	if !isHeartbeatRequest(req) {
		log.Printf("http request succeeded: method=%s path=%s", req.Method, req.URL.Path)
	}
	return nil
}

func isHeartbeatRequest(req *http.Request) bool {
	if req == nil || req.URL == nil {
		return false
	}
	return req.Method == http.MethodPost && req.URL.Path == "/api/agent/nodes/heartbeat"
}
