import React, { useEffect, useState } from 'react';
import { Header, Label, Segment, Table } from 'semantic-ui-react';
import { API, formatDateTime, showError } from '../../helpers';

const renderStatus = (status) => {
  if (status === 'online') {
    return <Label color='green'>在线</Label>;
  }
  return <Label color='grey'>离线</Label>;
};

const renderApply = (result) => {
  if (result === 'success') {
    return <Label color='green'>成功</Label>;
  }
  if (result === 'failed') {
    return <Label color='red'>失败</Label>;
  }
  return <Label>暂无</Label>;
};

const Node = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNodes = async () => {
    setLoading(true);
    const res = await API.get('/api/nodes/');
    const { success, message, data } = res.data;
    if (success) {
      setNodes(data || []);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNodes().then();
  }, []);

  return (
    <Segment loading={loading}>
      <Header as='h3'>节点状态</Header>
      <p className='page-subtitle'>查看节点在线状态、当前版本和最近一次应用结果。</p>

      <Table celled stackable className='atsf-table'>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>节点名</Table.HeaderCell>
            <Table.HeaderCell>Node ID</Table.HeaderCell>
            <Table.HeaderCell>IP</Table.HeaderCell>
            <Table.HeaderCell>状态</Table.HeaderCell>
            <Table.HeaderCell>Agent / Nginx</Table.HeaderCell>
            <Table.HeaderCell>当前版本</Table.HeaderCell>
            <Table.HeaderCell>最近应用</Table.HeaderCell>
            <Table.HeaderCell>最近心跳</Table.HeaderCell>
            <Table.HeaderCell>错误</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {nodes.map((node) => (
            <Table.Row key={node.id}>
              <Table.Cell>{node.name}</Table.Cell>
              <Table.Cell>{node.node_id}</Table.Cell>
              <Table.Cell>{node.ip}</Table.Cell>
              <Table.Cell>{renderStatus(node.status)}</Table.Cell>
              <Table.Cell>{node.agent_version} / {node.nginx_version || 'unknown'}</Table.Cell>
              <Table.Cell>{node.current_version || '未应用'}</Table.Cell>
              <Table.Cell>
                {renderApply(node.latest_apply_result)}
                <div className='table-meta'>{node.latest_apply_message || '暂无记录'}</div>
              </Table.Cell>
              <Table.Cell>{formatDateTime(node.last_seen_at)}</Table.Cell>
              <Table.Cell>{node.last_error || '无'}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Segment>
  );
};

export default Node;
