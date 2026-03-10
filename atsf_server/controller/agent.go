package controller

import (
	"encoding/json"
	"gin-template/model"
	"gin-template/service"
	"github.com/gin-gonic/gin"
	"net/http"
)

func AgentRegister(c *gin.Context) {
	var payload service.AgentNodePayload
	if err := json.NewDecoder(c.Request.Body).Decode(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	discoveryNode, ok := c.Get("discovery_node")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "无权进行此操作，Discovery Token 无效",
		})
		return
	}
	result, err := service.RegisterNode(discoveryNode.(*model.Node), payload)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    result,
	})
}

func AgentHeartbeat(c *gin.Context) {
	var payload service.AgentNodePayload
	if err := json.NewDecoder(c.Request.Body).Decode(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	authNode, ok := c.Get("agent_node")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "无权进行此操作，Agent Token 无效",
		})
		return
	}
	node, err := service.HeartbeatNode(authNode.(*model.Node), payload)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    node,
	})
}

func AgentGetActiveConfig(c *gin.Context) {
	config, err := service.GetActiveConfigForAgent()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "当前没有激活版本",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    config,
	})
}

func AgentReportApplyLog(c *gin.Context) {
	var payload service.ApplyLogPayload
	if err := json.NewDecoder(c.Request.Body).Decode(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	authNode, ok := c.Get("agent_node")
	if ok {
		payload.NodeID = authNode.(*model.Node).NodeID
	}
	log, err := service.ReportApplyLog(payload)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    log,
	})
}

func GetNodes(c *gin.Context) {
	nodes, err := service.ListNodeViews()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    nodes,
	})
}

func GetApplyLogs(c *gin.Context) {
	logs, err := service.ListApplyLogs(c.Query("node_id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    logs,
	})
}
