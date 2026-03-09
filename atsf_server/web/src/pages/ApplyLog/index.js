import React, { useEffect, useState } from 'react';
import { Form, Header, Label, Segment, Table } from 'semantic-ui-react';
import { API, formatDateTime, showError } from '../../helpers';

const ApplyLog = () => {
  const [logs, setLogs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const loadLogs = async (nodeId = '') => {
    setLoading(true);
    const path = nodeId ? `/api/apply-logs/?node_id=${encodeURIComponent(nodeId)}` : '/api/apply-logs/';
    const res = await API.get(path);
    const { success, message, data } = res.data;
    if (success) {
      setLogs(data || []);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs().then();
  }, []);

  const submit = async () => {
    await loadLogs(keyword.trim());
  };

  return (
    <Segment loading={loading}>
      <Header as='h3'>应用记录</Header>
      <p className='page-subtitle'>按节点查看配置应用成功或失败记录。</p>

      <Form onSubmit={submit}>
        <Form.Input
          icon='search'
          iconPosition='left'
          placeholder='输入 node_id 过滤应用记录'
          value={keyword}
          onChange={(e, { value }) => setKeyword(value)}
        />
      </Form>

      <Table celled stackable className='atsf-table'>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Node ID</Table.HeaderCell>
            <Table.HeaderCell>版本</Table.HeaderCell>
            <Table.HeaderCell>结果</Table.HeaderCell>
            <Table.HeaderCell>信息</Table.HeaderCell>
            <Table.HeaderCell>时间</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {logs.map((log) => (
            <Table.Row key={log.id}>
              <Table.Cell>{log.node_id}</Table.Cell>
              <Table.Cell>{log.version}</Table.Cell>
              <Table.Cell>
                {log.result === 'success' ? <Label color='green'>成功</Label> : <Label color='red'>失败</Label>}
              </Table.Cell>
              <Table.Cell>{log.message || '无'}</Table.Cell>
              <Table.Cell>{formatDateTime(log.created_at)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Segment>
  );
};

export default ApplyLog;
