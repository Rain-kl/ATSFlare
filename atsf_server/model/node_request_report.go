package model

import "time"

type NodeRequestReport struct {
	ID                  uint      `json:"id" gorm:"primaryKey"`
	NodeID              string    `json:"node_id" gorm:"index;size:64;not null"`
	WindowStartedAt     time.Time `json:"window_started_at" gorm:"index"`
	WindowEndedAt       time.Time `json:"window_ended_at" gorm:"index"`
	RequestCount        int64     `json:"request_count"`
	ErrorCount          int64     `json:"error_count"`
	UniqueVisitorCount  int64     `json:"unique_visitor_count"`
	StatusCodesJSON     string    `json:"status_codes_json" gorm:"type:text"`
	TopDomainsJSON      string    `json:"top_domains_json" gorm:"type:text"`
	SourceCountriesJSON string    `json:"source_countries_json" gorm:"type:text"`
	RawJSON             string    `json:"raw_json" gorm:"type:text"`
	CreatedAt           time.Time `json:"created_at"`
}

func (report *NodeRequestReport) Insert() error {
	return DB.Create(report).Error
}

func ListNodeRequestReports(nodeID string, since time.Time, limit int) (reports []*NodeRequestReport, err error) {
	query := DB.Where("node_id = ?", nodeID).Order("window_ended_at desc")
	if !since.IsZero() {
		query = query.Where("window_ended_at >= ?", since)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	err = query.Find(&reports).Error
	return reports, err
}

func ListRequestReportsSince(since time.Time) (reports []*NodeRequestReport, err error) {
	query := DB.Order("window_ended_at desc")
	if !since.IsZero() {
		query = query.Where("window_ended_at >= ?", since)
	}
	err = query.Find(&reports).Error
	return reports, err
}
