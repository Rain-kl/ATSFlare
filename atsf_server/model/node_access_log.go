package model

import "time"

type NodeAccessLog struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	NodeID     string    `json:"node_id" gorm:"index;size:64;not null"`
	LoggedAt   time.Time `json:"logged_at" gorm:"index"`
	RemoteAddr string    `json:"remote_addr" gorm:"size:128"`
	Host       string    `json:"host" gorm:"size:255"`
	Path       string    `json:"path" gorm:"size:2048"`
	StatusCode int       `json:"status_code"`
	RawJSON    string    `json:"raw_json" gorm:"type:text"`
	CreatedAt  time.Time `json:"created_at"`
}

func ListNodeAccessLogs(nodeID string, since time.Time, limit int) (logs []*NodeAccessLog, err error) {
	query := DB.Order("logged_at desc, id desc")
	if nodeID != "" {
		query = query.Where("node_id = ?", nodeID)
	}
	if !since.IsZero() {
		query = query.Where("logged_at >= ?", since)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	err = query.Find(&logs).Error
	return logs, err
}
