package controller

import "atsflare/service"

import "github.com/gin-gonic/gin"

// GetAccessLogs godoc
// @Summary List access logs
// @Tags AccessLogs
// @Produce json
// @Security BearerAuth
// @Param node_id query string false "Node ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/access-logs/ [get]
func GetAccessLogs(c *gin.Context) {
	logs, err := service.ListAccessLogs(c.Query("node_id"))
	if err != nil {
		respondFailure(c, err.Error())
		return
	}
	respondSuccess(c, logs)
}
