package controller

import (
	"atsflare/service"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type nodeAgentUpdateRequest struct {
	Channel string `json:"channel"`
	TagName string `json:"tag_name"`
}

// CreateNode godoc
// @Summary Create node
// @Tags Nodes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body service.NodeInput true "Node payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/nodes/ [post]
func CreateNode(c *gin.Context) {
	var input service.NodeInput
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	node, err := service.CreateNode(input)
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

// GetNodeBootstrapToken godoc
// @Summary Get global discovery token
// @Tags Nodes
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /api/nodes/bootstrap-token [get]
func GetNodeBootstrapToken(c *gin.Context) {
	bootstrap, err := service.GetNodeBootstrapView()
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
		"data":    bootstrap,
	})
}

// RotateNodeBootstrapToken godoc
// @Summary Rotate global discovery token
// @Tags Nodes
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /api/nodes/bootstrap-token/rotate [post]
func RotateNodeBootstrapToken(c *gin.Context) {
	bootstrap, err := service.RotateGlobalDiscoveryToken()
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
		"data":    bootstrap,
	})
}

// UpdateNode godoc
// @Summary Update node
// @Tags Nodes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Node ID"
// @Param payload body service.NodeInput true "Node payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/nodes/{id} [put]
func UpdateNode(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	var input service.NodeInput
	if err = json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	node, err := service.UpdateNode(uint(id), input)
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

// DeleteNode godoc
// @Summary Delete node
// @Tags Nodes
// @Produce json
// @Security BearerAuth
// @Param id path int true "Node ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/nodes/{id} [delete]
func DeleteNode(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	if err = service.DeleteNode(uint(id)); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

// RequestNodeAgentUpdate godoc
// @Summary Request agent self-update on node
// @Tags Nodes
// @Produce json
// @Security BearerAuth
// @Param id path int true "Node ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/nodes/{id}/agent-update [post]
func RequestNodeAgentUpdate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	var request nodeAgentUpdateRequest
	if c.Request.ContentLength > 0 {
		if err = json.NewDecoder(c.Request.Body).Decode(&request); err != nil && !errors.Is(err, io.EOF) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "无效的参数",
			})
			return
		}
	}
	node, err := service.RequestNodeAgentUpdate(uint(id), service.NodeAgentUpdateInput{
		Channel: request.Channel,
		TagName: request.TagName,
	})
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

// GetNodeAgentRelease godoc
// @Summary Check latest agent release for node
// @Tags Nodes
// @Produce json
// @Security BearerAuth
// @Param id path int true "Node ID"
// @Param channel query string false "stable or preview"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/nodes/{id}/agent-release [get]
func GetNodeAgentRelease(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	release, err := service.GetNodeAgentRelease(c.Request.Context(), uint(id), c.Query("channel"))
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
		"data":    release,
	})
}
