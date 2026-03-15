package model

import "time"

type NodeAccessLog struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	NodeID     string    `json:"node_id" gorm:"index;size:64;not null"`
	LoggedAt   time.Time `json:"logged_at" gorm:"index"`
	RemoteAddr string    `json:"remote_addr" gorm:"size:128"`
	Region     string    `json:"region" gorm:"size:128"`
	Host       string    `json:"host" gorm:"size:255"`
	Path       string    `json:"path" gorm:"size:2048"`
	StatusCode int       `json:"status_code"`
	RawJSON    string    `json:"raw_json" gorm:"type:text"`
	CreatedAt  time.Time `json:"created_at"`
}

type NodeAccessLogRegionCount struct {
	Region string `json:"region"`
	Count  int64  `json:"count"`
}

func ListNodeAccessLogs(nodeID string, since time.Time, offset int, limit int) (logs []*NodeAccessLog, err error) {
	query := DB.Order("logged_at desc, id desc")
	if nodeID != "" {
		query = query.Where("node_id = ?", nodeID)
	}
	if !since.IsZero() {
		query = query.Where("logged_at >= ?", since)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	err = query.Find(&logs).Error
	return logs, err
}

func CountNodeAccessLogs(nodeID string, since time.Time) (totalRecords int64, totalIPs int64, err error) {
	query := DB.Model(&NodeAccessLog{})
	if nodeID != "" {
		query = query.Where("node_id = ?", nodeID)
	}
	if !since.IsZero() {
		query = query.Where("logged_at >= ?", since)
	}
	if err = query.Count(&totalRecords).Error; err != nil {
		return 0, 0, err
	}
	if err = query.
		Where("remote_addr <> ''").
		Distinct("remote_addr").
		Count(&totalIPs).Error; err != nil {
		return 0, 0, err
	}
	return totalRecords, totalIPs, nil
}

func ListNodeAccessLogRegionCounts(nodeID string, since time.Time, limit int) (items []*NodeAccessLogRegionCount, err error) {
	query := DB.Model(&NodeAccessLog{}).
		Select("region as region, count(*) as count").
		Where("region <> ''")
	if nodeID != "" {
		query = query.Where("node_id = ?", nodeID)
	}
	if !since.IsZero() {
		query = query.Where("logged_at >= ?", since)
	}
	query = query.Group("region").Order("count desc, region asc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err = query.Scan(&items).Error
	return items, err
}
