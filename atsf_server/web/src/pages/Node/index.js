import React, { useEffect, useState } from 'react';
import { Button, Form, Header, Label, Segment, Table } from 'semantic-ui-react';
import { API, formatDateTime, showError, showSuccess } from '../../helpers';

const initialForm = {
  name: '',
};

const renderStatus = (status) => {
  if (status === 'online') {
    return <Label color='green'>在线</Label>;
  }
  if (status === 'pending') {
    return <Label color='orange'>待接入</Label>;
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
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

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

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const submitNode = async () => {
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
    };
    const res = editingId
      ? await API.put(`/api/nodes/${editingId}`, payload)
      : await API.post('/api/nodes/', payload);
    const { success, message } = res.data;
    if (success) {
      showSuccess(editingId ? '节点已更新' : '节点已创建');
      resetForm();
      await loadNodes();
    } else {
      showError(message);
    }
    setSubmitting(false);
  };

  const beginEdit = (node) => {
    setEditingId(node.id);
    setForm({
      name: node.name || '',
    });
  };

  const deleteNode = async (node) => {
    if (!window.confirm(`确认删除节点“${node.name}”吗？删除后该节点需要重新创建并重新接入。`)) {
      return;
    }
    const res = await API.delete(`/api/nodes/${node.id}`);
    const { success, message } = res.data;
    if (success) {
      showSuccess('节点已删除');
      if (editingId === node.id) {
        resetForm();
      }
      await loadNodes();
    } else {
      showError(message);
    }
  };

  return (
    <Segment loading={loading}>
      <Header as='h3'>节点管理</Header>
      <p className='page-subtitle'>创建节点、查看接入令牌，并跟踪节点在线状态、版本与最近一次应用结果。</p>

      <Form onSubmit={submitNode}>
        <Form.Group widths='equal'>
          <Form.Input
            label='节点名'
            placeholder='例如 shanghai-edge-1'
            value={form.name}
            onChange={(e, { value }) => setForm({ ...form, name: value })}
          />
        </Form.Group>
        <Button primary type='submit' loading={submitting}>
          {editingId ? '保存修改' : '新增节点'}
        </Button>
        {editingId ? (
          <Button type='button' onClick={resetForm}>
            取消编辑
          </Button>
        ) : null}
      </Form>

      <Table celled stackable className='atsf-table'>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>节点名</Table.HeaderCell>
            <Table.HeaderCell>Node ID</Table.HeaderCell>
            <Table.HeaderCell>Discovery Token</Table.HeaderCell>
            <Table.HeaderCell>IP</Table.HeaderCell>
            <Table.HeaderCell>状态</Table.HeaderCell>
            <Table.HeaderCell>Agent / Nginx</Table.HeaderCell>
            <Table.HeaderCell>当前版本</Table.HeaderCell>
            <Table.HeaderCell>最近应用</Table.HeaderCell>
            <Table.HeaderCell>最近心跳</Table.HeaderCell>
            <Table.HeaderCell>错误</Table.HeaderCell>
            <Table.HeaderCell>操作</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {nodes.map((node) => (
            <Table.Row key={node.id}>
              <Table.Cell>{node.name}</Table.Cell>
              <Table.Cell>{node.node_id}</Table.Cell>
              <Table.Cell>
                {node.pending && node.discovery_token ? (
                  <>
                    <Label color='orange'>待接入</Label>
                    <div className='table-meta' style={{ wordBreak: 'break-all' }}>{node.discovery_token}</div>
                  </>
                ) : '已激活'}
              </Table.Cell>
              <Table.Cell>{node.ip}</Table.Cell>
              <Table.Cell>{renderStatus(node.status)}</Table.Cell>
              <Table.Cell>{node.agent_version} / {node.nginx_version || 'unknown'}</Table.Cell>
              <Table.Cell>{node.current_version || '未应用'}</Table.Cell>
              <Table.Cell>
                {renderApply(node.latest_apply_result)}
                <div className='table-meta'>{node.latest_apply_message || '暂无记录'}</div>
              </Table.Cell>
              <Table.Cell>{node.last_seen_at ? formatDateTime(node.last_seen_at) : '暂无'}</Table.Cell>
              <Table.Cell>{node.last_error || '无'}</Table.Cell>
              <Table.Cell>
                <Button size='small' onClick={() => beginEdit(node)}>
                  编辑
                </Button>
                <Button size='small' negative onClick={() => deleteNode(node)}>
                  删除
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Segment>
  );
};

export default Node;
