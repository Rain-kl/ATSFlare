import React, { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  Form,
  Grid,
  Header,
  Icon,
  Label,
  Message,
  Segment,
} from 'semantic-ui-react';
import { API, copy, showError, showSuccess } from '../helpers';

const OperationSetting = () => {
  const [inputs, setInputs] = useState({
    AgentHeartbeatInterval: '30000',
    AgentSyncInterval: '30000',
    NodeOfflineThreshold: '120000',
    AgentUpdateRepo: 'Rain-kl/ATSFlare',
    ServerAddress: '',
    AgentDiscoveryToken: '',
  });
  const [loading, setLoading] = useState(false);

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (item.key in inputs) {
          newInputs[item.key] = item.value;
        }
      });
      setInputs((prev) => ({ ...prev, ...newInputs }));
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getOptions();
    getDiscoveryToken();
  }, []);

  const getDiscoveryToken = async () => {
    try {
      const res = await API.get('/api/nodes/bootstrap-token');
      const { success, data } = res.data;
      if (success && data) {
        setInputs((prev) => ({
          ...prev,
          AgentDiscoveryToken: data.discovery_token,
        }));
      }
    } catch (e) {
      // ignore
    }
  };

  const updateOption = async (key, value) => {
    setLoading(true);
    const res = await API.put('/api/option', { key, value });
    const { success, message } = res.data;
    if (success) {
      showSuccess('设置已保存');
      setInputs((prev) => ({ ...prev, [key]: value }));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const handleInputChange = (e, { name, value }) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const submitAgentIntervals = async () => {
    const hb = parseInt(inputs.AgentHeartbeatInterval, 10);
    const sync = parseInt(inputs.AgentSyncInterval, 10);
    const offline = parseInt(inputs.NodeOfflineThreshold, 10);
    if (isNaN(hb) || hb < 5000) {
      showError('心跳间隔不能小于 5000 毫秒');
      return;
    }
    if (isNaN(sync) || sync < 5000) {
      showError('同步间隔不能小于 5000 毫秒');
      return;
    }
    if (isNaN(offline) || offline < 10000) {
      showError('离线阈值不能小于 10000 毫秒');
      return;
    }
    await updateOption('AgentHeartbeatInterval', String(hb));
    await updateOption('AgentSyncInterval', String(sync));
    await updateOption('NodeOfflineThreshold', String(offline));
  };

  const submitUpdateRepo = async () => {
    await updateOption('AgentUpdateRepo', inputs.AgentUpdateRepo);
  };

  const rotateDiscoveryToken = async () => {
    setLoading(true);
    try {
      const res = await API.post('/api/nodes/bootstrap-token/rotate');
      const { success, message, data } = res.data;
      if (success) {
        showSuccess('Discovery Token 已重新生成');
        setInputs((prev) => ({
          ...prev,
          AgentDiscoveryToken: data.discovery_token,
        }));
      } else {
        showError(message);
      }
    } catch (e) {
      showError('操作失败');
    }
    setLoading(false);
  };

  const formatMs = (ms) => {
    const val = parseInt(ms, 10);
    if (isNaN(val)) return ms;
    if (val >= 60000) return `${val / 60000} 分钟`;
    return `${val / 1000} 秒`;
  };

  const serverAddr = inputs.ServerAddress || window.location.origin;
  const curlCommand = inputs.AgentDiscoveryToken
    ? `curl -fsSL https://raw.githubusercontent.com/Rain-kl/ATSFlare/main/scripts/install-agent.sh | bash -s -- --server-url ${serverAddr} --discovery-token ${inputs.AgentDiscoveryToken}`
    : '';
  const openSwaggerDoc = () => {
    window.open('/swagger/index.html', '_blank', 'noopener,noreferrer');
  };

  return (
    <Grid columns={1}>
      <Grid.Column>
        <Form loading={loading}>
          <Header as='h3'>接口文档</Header>
          <Message info size='small'>
            <p>通过 Swagger UI 查看当前 Server API，并直接在浏览器中调试接口。</p>
          </Message>
          <Button onClick={openSwaggerDoc} primary>
            打开接口文档
          </Button>

          <Divider />
          <Header as='h3'>Agent 运行参数</Header>
          <Message info size='small'>
            <p>这些参数通过心跳响应下发到所有 Agent，修改后下次心跳即生效。</p>
          </Message>
          <Form.Group widths='equal'>
            <Form.Input
              label={`心跳间隔 (${formatMs(inputs.AgentHeartbeatInterval)})`}
              placeholder='30000'
              value={inputs.AgentHeartbeatInterval}
              name='AgentHeartbeatInterval'
              onChange={handleInputChange}
              type='number'
            />
            <Form.Input
              label={`同步间隔 (${formatMs(inputs.AgentSyncInterval)})`}
              placeholder='30000'
              value={inputs.AgentSyncInterval}
              name='AgentSyncInterval'
              onChange={handleInputChange}
              type='number'
            />
            <Form.Input
              label={`离线阈值 (${formatMs(inputs.NodeOfflineThreshold)})`}
              placeholder='120000'
              value={inputs.NodeOfflineThreshold}
              name='NodeOfflineThreshold'
              onChange={handleInputChange}
              type='number'
            />
          </Form.Group>
          <Form.Button onClick={submitAgentIntervals} primary>
            保存运行参数
          </Form.Button>

          <Divider />
          <Header as='h3'>Agent 更新源</Header>
          <Message info size='small'>
            <p>
              自动更新开关和手动更新由节点页单独控制，这里只配置 Agent
              更新仓库。
            </p>
          </Message>
          <Form.Group widths='equal'>
            <Form.Input
              label='更新仓库'
              placeholder='Rain-kl/ATSFlare'
              value={inputs.AgentUpdateRepo}
              name='AgentUpdateRepo'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Button onClick={submitUpdateRepo} primary>
            保存更新设置
          </Form.Button>

          <Divider />
          <Header as='h3'>节点接入</Header>
          <Form.Group widths='equal'>
            <Form.Field>
              <label>全局 Discovery Token</label>
              <Segment>
                <Label basic>{inputs.AgentDiscoveryToken || '(未设置)'}</Label>
                <Button
                  size='mini'
                  icon
                  style={{ marginLeft: '8px' }}
                  onClick={() =>
                    copy(inputs.AgentDiscoveryToken, 'Discovery Token')
                  }
                  title='复制'
                >
                  <Icon name='copy' />
                </Button>
                <Button
                  size='mini'
                  color='orange'
                  style={{ marginLeft: '4px' }}
                  onClick={rotateDiscoveryToken}
                >
                  重新生成
                </Button>
              </Segment>
            </Form.Field>
          </Form.Group>

          {curlCommand && (
            <>
              <Header as='h4'>Agent 一键部署命令</Header>
              <Message>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    fontSize: '12px',
                    margin: 0,
                  }}
                >
                  {curlCommand}
                </pre>
              </Message>
              <Button
                size='small'
                icon
                labelPosition='left'
                onClick={() => copy(curlCommand, '部署命令')}
              >
                <Icon name='copy' />
                复制部署命令
              </Button>
            </>
          )}
        </Form>
      </Grid.Column>
    </Grid>
  );
};

export default OperationSetting;
