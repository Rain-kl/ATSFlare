package controller

import (
	"net/http"
	"openflare/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetConfigVersions godoc
// @Summary List config versions
// @Tags ConfigVersions
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /api/config-versions/ [get]
func GetConfigVersions(c *gin.Context) {
	versions, err := service.ListConfigVersions()
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
		"data":    versions,
	})
}

// GetConfigVersion godoc
// @Summary Get config version detail
// @Tags ConfigVersions
// @Produce json
// @Security BearerAuth
// @Param id path int true "Version ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/config-versions/{id} [get]
func GetConfigVersion(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "invalid id",
		})
		return
	}
	version, err := service.GetConfigVersionDetail(uint(id))
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
		"data":    version,
	})
}

// GetActiveConfigVersion godoc
// @Summary Get active config version
// @Tags ConfigVersions
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /api/config-versions/active [get]
func GetActiveConfigVersion(c *gin.Context) {
	version, err := service.GetActiveConfigVersion()
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
		"data":    version,
	})
}

// PreviewConfigVersion godoc
// @Summary Preview config rendering
// @Tags ConfigVersions
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /api/config-versions/preview [get]
func PreviewConfigVersion(c *gin.Context) {
	preview, err := service.PreviewConfigVersion()
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
		"data":    preview,
	})
}

// DiffConfigVersion godoc
// @Summary Diff current draft against active version
// @Tags ConfigVersions
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /api/config-versions/diff [get]
func DiffConfigVersion(c *gin.Context) {
	diff, err := service.DiffConfigVersion()
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
		"data":    diff,
	})
}

// PublishConfigVersion godoc
// @Summary Publish a new config version
// @Tags ConfigVersions
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /api/config-versions/publish [post]
func PublishConfigVersion(c *gin.Context) {
	username := c.GetString("username")
	result, err := service.PublishConfigVersion(username)
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
		"data":    result.Version,
	})
}

// ActivateConfigVersion godoc
// @Summary Activate an existing config version
// @Tags ConfigVersions
// @Produce json
// @Security BearerAuth
// @Param id path int true "Version ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/config-versions/{id}/activate [post]
func ActivateConfigVersion(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "invalid id",
		})
		return
	}
	version, err := service.ActivateConfigVersion(uint(id))
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
		"data":    version,
	})
}
