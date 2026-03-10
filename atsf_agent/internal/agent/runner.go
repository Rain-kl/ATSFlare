package agent

import (
	"context"
	"errors"
	"log"
	"strings"
	"time"

	"atsflare-agent/internal/config"
	"atsflare-agent/internal/protocol"
	"atsflare-agent/internal/state"
)

type HeartbeatService interface {
	Register(ctx context.Context, payload protocol.NodePayload) (*protocol.RegisterNodeResponse, error)
	Heartbeat(ctx context.Context, payload protocol.NodePayload) error
	SetToken(token string)
}

type SyncService interface {
	SyncOnStartup(ctx context.Context) error
	SyncOnce(ctx context.Context) error
}

type Runner struct {
	Config           *config.Config
	StateStore       *state.Store
	HeartbeatService HeartbeatService
	SyncService      SyncService
}

func (r *Runner) Run(ctx context.Context) error {
	nodeID, err := r.StateStore.EnsureNodeID()
	if err != nil {
		return err
	}
	log.Printf("agent runner started: node_id=%s node=%s ip=%s", nodeID, r.Config.NodeName, r.Config.NodeIP)
	if r.hasAgentToken() {
		if err = r.SyncService.SyncOnStartup(ctx); err != nil {
			r.recordSyncError(err)
			log.Printf("agent startup sync failed: %v", err)
		} else {
			log.Printf("agent startup sync completed")
		}
		if err = r.HeartbeatService.Heartbeat(ctx, r.nodePayload(nodeID)); err != nil {
			log.Printf("agent startup heartbeat failed: %v", err)
		} else {
			log.Printf("agent startup heartbeat succeeded: node_id=%s", nodeID)
		}
	} else if err = r.tryRegister(ctx, &nodeID); err != nil {
		log.Printf("agent initial discovery register failed: %v", err)
	}

	heartbeatTicker := time.NewTicker(r.Config.HeartbeatInterval.Duration())
	defer heartbeatTicker.Stop()
	syncTicker := time.NewTicker(r.Config.SyncInterval.Duration())
	defer syncTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("agent runner shutting down: %v", ctx.Err())
			return ctx.Err()
		case <-heartbeatTicker.C:
			if !r.hasAgentToken() {
				if err = r.tryRegister(ctx, &nodeID); err != nil {
					log.Printf("agent discovery register failed: %v", err)
				}
				continue
			}
			if err = r.HeartbeatService.Heartbeat(ctx, r.nodePayload(nodeID)); err != nil {
				log.Printf("agent heartbeat failed: %v", err)
			}
		case <-syncTicker.C:
			if !r.hasAgentToken() {
				continue
			}
			log.Printf("agent sync tick: node_id=%s", nodeID)
			if err = r.SyncService.SyncOnce(ctx); err != nil {
				r.recordSyncError(err)
				log.Printf("agent sync failed: %v", err)
			} else {
				log.Printf("agent sync completed")
			}
		}
	}
}

func (r *Runner) hasAgentToken() bool {
	return strings.TrimSpace(r.Config.AgentToken) != ""
}

func (r *Runner) tryRegister(ctx context.Context, nodeID *string) error {
	if strings.TrimSpace(r.Config.DiscoveryToken) == "" {
		return errors.New("agent_token 为空且未配置 discovery_token")
	}
	log.Printf("agent discovery registration started")
	response, err := r.HeartbeatService.Register(ctx, r.nodePayload(*nodeID))
	if err != nil {
		return err
	}
	if response == nil || strings.TrimSpace(response.AgentToken) == "" || strings.TrimSpace(response.NodeID) == "" {
		return errors.New("discovery register response 缺少 node_id 或 agent_token")
	}
	snapshot, err := r.StateStore.Load()
	if err != nil {
		return err
	}
	snapshot.NodeID = response.NodeID
	if err = r.StateStore.Save(snapshot); err != nil {
		return err
	}
	r.Config.AgentToken = response.AgentToken
	r.Config.DiscoveryToken = ""
	if err = r.Config.Save(); err != nil {
		return err
	}
	r.HeartbeatService.SetToken(response.AgentToken)
	*nodeID = response.NodeID
	log.Printf("agent discovery registration succeeded: node_id=%s", response.NodeID)
	if err = r.SyncService.SyncOnStartup(ctx); err != nil {
		r.recordSyncError(err)
		log.Printf("agent post-register startup sync failed: %v", err)
	} else {
		log.Printf("agent post-register startup sync completed")
	}
	return nil
}

func (r *Runner) recordSyncError(err error) {
	if err == nil || r.StateStore == nil {
		return
	}
	snapshot, loadErr := r.StateStore.Load()
	if loadErr != nil {
		log.Printf("load state before recording sync error failed: %v", loadErr)
		return
	}
	snapshot.LastError = err.Error()
	log.Printf("recording sync error into state: %s", snapshot.LastError)
	if saveErr := r.StateStore.Save(snapshot); saveErr != nil {
		log.Printf("save state after sync error failed: %v", saveErr)
	}
}

func (r *Runner) nodePayload(nodeID string) protocol.NodePayload {
	snapshot, _ := r.StateStore.Load()
	return protocol.NodePayload{
		NodeID:         nodeID,
		Name:           r.Config.NodeName,
		IP:             r.Config.NodeIP,
		AgentVersion:   r.Config.AgentVersion,
		NginxVersion:   r.Config.NginxVersion,
		CurrentVersion: snapshot.CurrentVersion,
		LastError:      snapshot.LastError,
	}
}
