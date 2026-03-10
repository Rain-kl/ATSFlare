package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"gin-template/common"
	"gin-template/model"
	"strings"
	"time"
)

type NodeInput struct {
	Name string `json:"name"`
}

type AgentRegistrationResponse struct {
	NodeID     string `json:"node_id"`
	AgentToken string `json:"agent_token"`
	Name       string `json:"name"`
}

func CreateNode(input NodeInput) (*NodeView, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, errors.New("节点名不能为空")
	}
	node := &model.Node{
		Name:         name,
		IP:           "",
		AgentVersion: "",
		NginxVersion: "",
		Status:       NodeStatusPending,
	}
	var err error
	node.NodeID, err = newServerNodeID()
	if err != nil {
		return nil, err
	}
	node.DiscoveryToken, err = newRandomToken()
	if err != nil {
		return nil, err
	}
	if err := node.Insert(); err != nil {
		if isUniqueConstraintError(err) {
			return nil, errors.New("节点标识生成冲突，请重试")
		}
		return nil, err
	}
	common.SysLog("node created: name=" + node.Name + " node_id=" + node.NodeID)
	return buildNodeView(node), nil
}

func UpdateNode(id uint, input NodeInput) (*NodeView, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, errors.New("节点名不能为空")
	}
	node, err := model.GetNodeByID(id)
	if err != nil {
		return nil, err
	}
	node.Name = name
	if err = node.Update(); err != nil {
		return nil, err
	}
	common.SysLog("node updated: name=" + node.Name + " node_id=" + node.NodeID)
	return buildNodeView(node), nil
}

func DeleteNode(id uint) error {
	node, err := model.GetNodeByID(id)
	if err != nil {
		return err
	}
	common.SysLog("node deleted: name=" + node.Name + " node_id=" + node.NodeID)
	return node.Delete()
}

func AuthenticateAgentToken(token string) (*model.Node, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, errors.New("缺少 Agent Token")
	}
	return model.GetNodeByAgentToken(token)
}

func AuthenticateDiscoveryToken(token string) (*model.Node, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, errors.New("缺少 Discovery Token")
	}
	return model.GetNodeByDiscoveryToken(token)
}

func buildNodeView(node *model.Node) *NodeView {
	status := computeNodeStatus(node)
	view := &NodeView{
		ID:             node.ID,
		NodeID:         node.NodeID,
		Name:           node.Name,
		IP:             node.IP,
		AgentVersion:   node.AgentVersion,
		NginxVersion:   node.NginxVersion,
		Status:         status,
		CurrentVersion: node.CurrentVersion,
		LastSeenAt:     node.LastSeenAt,
		LastError:      node.LastError,
		CreatedAt:      node.CreatedAt,
		UpdatedAt:      node.UpdatedAt,
		Pending:        status == NodeStatusPending,
	}
	if status == NodeStatusPending {
		view.DiscoveryToken = node.DiscoveryToken
	}
	return view
}

func applyNodeRuntime(node *model.Node, payload AgentNodePayload, preserveName bool) {
	if !preserveName || strings.TrimSpace(node.Name) == "" {
		if strings.TrimSpace(payload.Name) != "" {
			node.Name = strings.TrimSpace(payload.Name)
		}
	}
	node.IP = strings.TrimSpace(payload.IP)
	node.AgentVersion = strings.TrimSpace(payload.AgentVersion)
	node.NginxVersion = strings.TrimSpace(payload.NginxVersion)
	node.Status = NodeStatusOnline
	node.CurrentVersion = strings.TrimSpace(payload.CurrentVersion)
	node.LastSeenAt = time.Now()
	node.LastError = strings.TrimSpace(payload.LastError)
}

func newRandomToken() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func newServerNodeID() (string, error) {
	token, err := newRandomToken()
	if err != nil {
		return "", err
	}
	return "node-" + token, nil
}
