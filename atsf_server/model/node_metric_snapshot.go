package model

import "time"

type NodeMetricSnapshot struct {
	ID                   uint      `json:"id" gorm:"primaryKey"`
	NodeID               string    `json:"node_id" gorm:"index;size:64;not null"`
	CapturedAt           time.Time `json:"captured_at" gorm:"index"`
	CPUUsagePercent      float64   `json:"cpu_usage_percent"`
	MemoryUsedBytes      int64     `json:"memory_used_bytes"`
	MemoryTotalBytes     int64     `json:"memory_total_bytes"`
	StorageUsedBytes     int64     `json:"storage_used_bytes"`
	StorageTotalBytes    int64     `json:"storage_total_bytes"`
	DiskReadBytes        int64     `json:"disk_read_bytes"`
	DiskWriteBytes       int64     `json:"disk_write_bytes"`
	NetworkRxBytes       int64     `json:"network_rx_bytes"`
	NetworkTxBytes       int64     `json:"network_tx_bytes"`
	OpenrestyRxBytes     int64     `json:"openresty_rx_bytes"`
	OpenrestyTxBytes     int64     `json:"openresty_tx_bytes"`
	OpenrestyConnections int64     `json:"openresty_connections"`
	RawJSON              string    `json:"raw_json" gorm:"type:text"`
	CreatedAt            time.Time `json:"created_at"`
}

func (snapshot *NodeMetricSnapshot) Insert() error {
	return DB.Create(snapshot).Error
}

func ListNodeMetricSnapshots(nodeID string, since time.Time, limit int) (snapshots []*NodeMetricSnapshot, err error) {
	query := DB.Where("node_id = ?", nodeID).Order("captured_at desc")
	if !since.IsZero() {
		query = query.Where("captured_at >= ?", since)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	err = query.Find(&snapshots).Error
	return snapshots, err
}

func ListMetricSnapshotsSince(since time.Time) (snapshots []*NodeMetricSnapshot, err error) {
	query := DB.Order("captured_at desc")
	if !since.IsZero() {
		query = query.Where("captured_at >= ?", since)
	}
	err = query.Find(&snapshots).Error
	return snapshots, err
}
