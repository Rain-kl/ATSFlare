'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { InlineMessage } from '@/components/feedback/inline-message';
import { LoadingState } from '@/components/feedback/loading-state';
import { PageHeader } from '@/components/layout/page-header';
import { AppModal } from '@/components/ui/app-modal';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createNode,
  deleteNode,
  getNodes,
  updateNode,
} from '@/features/nodes/api/nodes';
import type { NodeMutationPayload } from '@/features/nodes/types';
import {
  DangerButton,
  PrimaryButton,
  ResourceField,
  ResourceInput,
  SecondaryButton,
  ToggleField,
} from '@/features/shared/components/resource-primitives';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/date';
import {
  getApplyLabel,
  getApplyVariant,
  getNodeStatusLabel,
  getNodeStatusVariant,
  getOpenrestyStatusLabel,
  getOpenrestyStatusVariant,
  isMeaningfulTime,
} from '@/features/nodes/utils';

const nodesQueryKey = ['nodes'];

const nodeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '请输入节点名')
    .max(128, '节点名不能超过 128 个字符'),
  auto_update_enabled: z.boolean(),
});

type NodeFormValues = z.infer<typeof nodeSchema>;

type FeedbackState = {
  tone: 'info' | 'success' | 'danger';
  message: string;
};

const defaultValues: NodeFormValues = {
  name: '',
  auto_update_enabled: false,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试。';
}

function toPayload(values: NodeFormValues): NodeMutationPayload {
  return {
    name: values.name.trim(),
    auto_update_enabled: values.auto_update_enabled,
  };
}

export function NodesPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const form = useForm<NodeFormValues>({
    resolver: zodResolver(nodeSchema),
    defaultValues,
  });

  const watchedAutoUpdate = useWatch({
    control: form.control,
    name: 'auto_update_enabled',
  });

  const nodesQuery = useQuery({
    queryKey: nodesQueryKey,
    queryFn: getNodes,
    refetchInterval: 5000,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: NodeFormValues) => {
      const payload = toPayload(values);
      return editingNodeId
        ? updateNode(editingNodeId, payload)
        : createNode(payload);
    },
    onSuccess: async () => {
      setFeedback({
        tone: 'success',
        message: editingNodeId ? '节点已更新。' : '节点已创建。',
      });
      setEditingNodeId(null);
      setIsEditorOpen(false);
      form.reset(defaultValues);
      await queryClient.invalidateQueries({ queryKey: nodesQueryKey });
    },
    onError: (error) => {
      setFeedback({ tone: 'danger', message: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: async () => {
      setFeedback({ tone: 'success', message: '节点已删除。' });
      setEditingNodeId(null);
      form.reset(defaultValues);
      await queryClient.invalidateQueries({ queryKey: nodesQueryKey });
    },
    onError: (error) => {
      setFeedback({ tone: 'danger', message: getErrorMessage(error) });
    },
  });

  const nodes = useMemo(() => nodesQuery.data ?? [], [nodesQuery.data]);

  const handleReset = () => {
    setFeedback(null);
    setEditingNodeId(null);
    setIsEditorOpen(false);
    form.reset(defaultValues);
  };

  const handleCreate = () => {
    setFeedback(null);
    setEditingNodeId(null);
    form.reset(defaultValues);
    setIsEditorOpen(true);
  };

  const handleEdit = (
    nodeId: number,
    name: string,
    autoUpdateEnabled: boolean,
  ) => {
    setFeedback(null);
    setEditingNodeId(nodeId);
    form.reset({
      name,
      auto_update_enabled: autoUpdateEnabled,
    });
    setIsEditorOpen(true);
  };

  const handleDelete = (nodeId: number, nodeName: string) => {
    if (
      !window.confirm(
        `确认删除节点“${nodeName}”吗？删除后该节点需要重新创建并重新接入。`,
      )
    ) {
      return;
    }

    setFeedback(null);
    deleteMutation.mutate(nodeId);
  };

  const handleSubmit = form.handleSubmit((values) => {
    setFeedback(null);
    saveMutation.mutate(values);
  });

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="节点管理"
          description="节点列表只保留状态、版本与最近活动等关键内容。节点部署、Token、更新模式与手动升级入口统一收敛到详情页。"
          action={
            <>
              <SecondaryButton type="button" onClick={handleCreate}>
                新增节点
              </SecondaryButton>
              <Link
                href="/apply-log"
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--control-background)] px-4 py-3 text-sm font-medium text-[var(--foreground-primary)] transition hover:bg-[var(--control-background-hover)]"
              >
                应用记录
              </Link>
            </>
          }
        />

        {feedback ? (
          <InlineMessage tone={feedback.tone} message={feedback.message} />
        ) : null}

        <AppCard
          title="节点列表"
          description="列表每 5 秒自动刷新一次。"
          action={
            <SecondaryButton
              type="button"
              onClick={() =>
                void queryClient.invalidateQueries({ queryKey: nodesQueryKey })
              }
            >
              立即刷新
            </SecondaryButton>
          }
        >
          {nodesQuery.isLoading ? (
            <LoadingState />
          ) : nodesQuery.isError ? (
            <ErrorState
              title="节点列表加载失败"
              description={getErrorMessage(nodesQuery.error)}
            />
          ) : nodes.length === 0 ? (
            <EmptyState
              title="暂无节点"
              description="请先创建一个节点，然后进入详情页查看专属部署命令。"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border-default)] text-left text-sm">
                <thead>
                  <tr className="text-[var(--foreground-secondary)]">
                    <th className="px-3 py-3 font-medium">节点</th>
                    <th className="px-3 py-3 font-medium">状态</th>
                    <th className="px-3 py-3 font-medium">Agent / OpenResty</th>
                    <th className="px-3 py-3 font-medium">运行健康</th>
                    <th className="px-3 py-3 font-medium">当前版本</th>
                    <th className="px-3 py-3 font-medium">最近应用</th>
                    <th className="px-3 py-3 font-medium">最近心跳</th>
                    <th className="px-3 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {nodes.map((node) => (
                    <tr key={node.id} className="align-top">
                      <td className="px-3 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-[var(--foreground-primary)]">
                            {node.name}
                          </p>
                          <p className="text-xs text-[var(--foreground-secondary)]">
                            IP：{node.ip || 'null'}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge
                          label={getNodeStatusLabel(node.status)}
                          variant={getNodeStatusVariant(node.status)}
                        />
                      </td>
                      <td className="px-3 py-4 text-[var(--foreground-secondary)]">
                        {node.agent_version || 'unknown'} /{' '}
                        {node.nginx_version || 'unknown'}
                      </td>
                      <td className="px-3 py-4">
                        <div className="space-y-2">
                          <StatusBadge
                            label={getOpenrestyStatusLabel(
                              node.openresty_status,
                            )}
                            variant={getOpenrestyStatusVariant(
                              node.openresty_status,
                            )}
                          />
                          <p className="max-w-64 text-xs break-words whitespace-pre-wrap text-[var(--foreground-secondary)]">
                            {node.openresty_message || '无额外错误'}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[var(--foreground-secondary)]">
                        {node.current_version || '未应用'}
                      </td>
                      <td className="px-3 py-4">
                        <div className="space-y-2">
                          <StatusBadge
                            label={getApplyLabel(node.latest_apply_result)}
                            variant={getApplyVariant(node.latest_apply_result)}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[var(--foreground-secondary)]">
                        {isMeaningfulTime(node.last_seen_at)
                          ? `${formatRelativeTime(
                              node.last_seen_at,
                            )} · ${formatDateTime(node.last_seen_at)}`
                          : '暂无'}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/node/detail?id=${node.id}`}
                            className="inline-flex items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--control-background)] px-3 py-2 text-xs font-medium text-[var(--foreground-primary)] transition hover:bg-[var(--control-background-hover)]"
                          >
                            详情
                          </Link>
                          <SecondaryButton
                            type="button"
                            onClick={() =>
                              handleEdit(
                                node.id,
                                node.name,
                                node.auto_update_enabled,
                              )
                            }
                            className="px-3 py-2 text-xs"
                          >
                            编辑
                          </SecondaryButton>
                          <DangerButton
                            type="button"
                            onClick={() => handleDelete(node.id, node.name)}
                            disabled={deleteMutation.isPending}
                            className="px-3 py-2 text-xs"
                          >
                            删除
                          </DangerButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AppCard>
      </div>
      <AppModal
        isOpen={isEditorOpen}
        onClose={handleReset}
        title={editingNodeId ? '编辑节点' : '新增节点'}
        description="预创建节点后可在详情页查看专属 Token、部署命令与更新控制。"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <SecondaryButton
              type="button"
              onClick={handleReset}
              disabled={saveMutation.isPending}
            >
              取消
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              form="node-editor-form"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? '保存中...'
                : editingNodeId
                  ? '保存修改'
                  : '新增节点'}
            </PrimaryButton>
          </div>
        }
      >
        <form
          id="node-editor-form"
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <ResourceField
            label="节点名"
            hint="示例：shanghai-edge-1"
            error={form.formState.errors.name?.message}
          >
            <ResourceInput
              placeholder="shanghai-edge-1"
              {...form.register('name')}
            />
          </ResourceField>

          <ToggleField
            label="启用自动更新"
            description="开启后 Agent 心跳返回会提示节点自动执行自更新。"
            checked={watchedAutoUpdate}
            onChange={(checked) =>
              form.setValue('auto_update_enabled', checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </form>
      </AppModal>
    </>
  );
}
