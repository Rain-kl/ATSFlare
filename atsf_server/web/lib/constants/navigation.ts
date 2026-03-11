import type {NavigationItem} from '@/types/navigation';

export const dashboardNavigation: NavigationItem[] = [
    {
        href: '/',
        label: '总览',
        icon: 'home',
    },
    {
        href: '/node',
        label: '节点',
        icon: 'node',
    },
    {
        href: '/proxy-route',
        label: '规则',
        icon: 'proxy',
    },
    {
        href: '/config-version',
        label: '发布',
        icon: 'release',
    },
    {
        href: '/managed-domain',
        label: '域名',
        icon: 'domain',
    },
    {
        href: '/tls-certificate',
        label: '证书',
        icon: 'certificate',
    },
    {
        href: '/user',
        label: '用户',
        icon: 'user',
    },
    {
        href: '/setting',
        label: '设置',
        icon: 'setting',
    },
];
