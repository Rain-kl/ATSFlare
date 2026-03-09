import React, { useEffect, useState } from 'react';
import {
  Button,
  Header,
  Icon,
  Label,
  Modal,
  Segment,
  Table,
} from 'semantic-ui-react';
import { API, formatDateTime, showError, showSuccess } from '../../helpers';

const ConfigVersion = () => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState(null);

  const loadVersions = async () => {
    setLoading(true);
    const res = await API.get('/api/config-versions/');
    const { success, message, data } = res.data;
    if (success) {
      setVersions(data || []);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVersions().then();
  }, []);

  const publishConfig = async () => {
    setPublishing(true);
    const res = await API.post('/api/config-versions/publish');
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(`发布成功，版本 ${data.version}`);
      await loadVersions();
    } else {
      showError(message);
    }
    setPublishing(false);
  };

  const activateVersion = async (id) => {
    const res = await API.put(`/api/config-versions/${id}/activate`);
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(`已激活版本 ${data.version}`);
      await loadVersions();
    } else {
      showError(message);
    }
  };

  return (
    <Segment loading={loading}>
      <div className='page-toolbar'>
        <div>
          <Header as='h3'>版本发布</Header>
          <p className='page-subtitle'>查看历史快照，发布新版本，或重新激活旧版本。</p>
        </div>
        <Button primary icon labelPosition='left' loading={publishing} onClick={publishConfig}>
          <Icon name='plus' />
          生成新版本
        </Button>
      </div>

      <Table celled stackable className='atsf-table'>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>版本号</Table.HeaderCell>
            <Table.HeaderCell>状态</Table.HeaderCell>
            <Table.HeaderCell>创建人</Table.HeaderCell>
            <Table.HeaderCell>Checksum</Table.HeaderCell>
            <Table.HeaderCell>创建时间</Table.HeaderCell>
            <Table.HeaderCell>操作</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {versions.map((version) => (
            <Table.Row key={version.id}>
              <Table.Cell>{version.version}</Table.Cell>
              <Table.Cell>
                {version.is_active ? <Label color='green'>当前激活</Label> : <Label>历史版本</Label>}
              </Table.Cell>
              <Table.Cell>{version.created_by}</Table.Cell>
              <Table.Cell title={version.checksum}>{(version.checksum || '').slice(0, 16)}...</Table.Cell>
              <Table.Cell>{formatDateTime(version.created_at)}</Table.Cell>
              <Table.Cell>
                <Button size='small' onClick={() => setPreview(version)}>
                  预览
                </Button>
                {!version.is_active ? (
                  <Button size='small' positive onClick={() => activateVersion(version.id)}>
                    激活
                  </Button>
                ) : null}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <Modal open={!!preview} onClose={() => setPreview(null)} closeIcon>
        <Modal.Header>版本预览</Modal.Header>
        <Modal.Content scrolling>
          {preview ? (
            <>
              <Header as='h4'>快照 JSON</Header>
              <pre className='atsf-pre'>{preview.snapshot_json}</pre>
              <Header as='h4'>渲染结果</Header>
              <pre className='atsf-pre'>{preview.rendered_config}</pre>
            </>
          ) : null}
        </Modal.Content>
      </Modal>
    </Segment>
  );
};

export default ConfigVersion;
