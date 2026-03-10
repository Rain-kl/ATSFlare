package middleware

import (
	"gin-template/service"
	"github.com/gin-gonic/gin"
	"net/http"
)

func AgentAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		token := c.GetHeader("X-Agent-Token")
		node, err := service.AuthenticateAgentToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "无权进行此操作，Agent Token 无效",
			})
			c.Abort()
			return
		}
		c.Set("agent_node", node)
		c.Next()
	}
}

func AgentDiscoveryAuth() func(c *gin.Context) {
	return func(c *gin.Context) {
		token := c.GetHeader("X-Agent-Token")
		node, err := service.AuthenticateDiscoveryToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "无权进行此操作，Discovery Token 无效",
			})
			c.Abort()
			return
		}
		c.Set("discovery_node", node)
		c.Next()
	}
}
