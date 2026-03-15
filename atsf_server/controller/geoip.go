package controller

import (
	"atsflare/service"

	"github.com/gin-gonic/gin"
)

type geoIPLookupRequest struct {
	Provider string `json:"provider"`
	IP       string `json:"ip"`
}

// LookupGeoIP godoc
// @Summary Test GeoIP lookup
// @Tags Options
// @Accept json
// @Produce json
// @Param payload body geoIPLookupRequest true "GeoIP lookup payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/option/geoip/lookup [post]
func LookupGeoIP(c *gin.Context) {
	var request geoIPLookupRequest
	if err := decodeJSONBody(c.Request.Body, &request); err != nil {
		respondBadRequest(c, "")
		return
	}

	view, err := service.LookupGeoIP(request.Provider, request.IP)
	if err != nil {
		respondFailure(c, err.Error())
		return
	}
	respondSuccess(c, view)
}
