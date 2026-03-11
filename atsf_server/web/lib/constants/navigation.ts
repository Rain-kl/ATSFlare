import type { NavigationItem } from '@/types/navigation';

export const dashboardNavigation: NavigationItem[] = [
  {
    href: '/',
    label: '总览',
    shortLabel: '总览',
    description: '查看阶段推进情况、系统入口与模块骨架状态。',
  },
  {
    href: '/proxy-route',
    label: '反代规则',
    shortLabel: '规则',
    description: '已接入列表、表单、证书匹配与发布动作。',
  },
  {
    href: '/config-version',
    label: '配置版本',
    shortLabel: '版本',
    description: '已接入版本预览、发布前 diff 与重新激活。',
  },
  {
    href: '/node',
    label: '节点管理',
    shortLabel: '节点',
    description: '已接入状态标签、部署命令、心跳与更新动作。',
  },
  {
    href: '/apply-log',
    label: '应用记录',
    shortLabel: '记录',
    description: '已接入 node_id 筛选、结果状态展示与单条详情查看。',
  },
  {
    href: '/managed-domain',
    label: '域名管理',
    shortLabel: '域名',
    description: '已接入列表、证书绑定、启停控制与编辑删除。',
  },
  {
    href: '/tls-certificate',
    label: 'TLS 证书',
    shortLabel: '证书',
    description: '已接入 PEM 导入、文件上传、到期展示与删除。',
  },
  {
    href: '/file',
    label: '文件管理',
    shortLabel: '文件',
    description: '已接入上传、下载、复制链接、搜索与删除动作。',
  },
  {
    href: '/user',
    label: '用户管理',
    shortLabel: '用户',
    description: '已接入搜索、创建、编辑、封禁与权限调整。',
  },
  {
    href: '/setting',
    label: '设置',
    shortLabel: '设置',
    description: '已接入个人、运维、系统与关于内容维护。',
  },
];
