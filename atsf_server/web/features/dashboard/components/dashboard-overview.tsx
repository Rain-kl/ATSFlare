import Link from 'next/link';

import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { dashboardNavigation } from '@/lib/constants/navigation';

const readinessItems = [
  {
    title: '工程底座',
    description: 'Next.js App Router、TypeScript strict、Tailwind CSS 与静态导出链路已稳定运行。',
  },
  {
    title: '认证骨架',
    description: '登录、注册、重置密码、鉴权守卫与后台布局已迁移到新前端。',
  },
  {
    title: '核心模块',
    description: '阶段 3 已接入反代规则、配置版本与节点页面，其余核心模块可继续按优先级接入。',
  },
];

export function DashboardOverview() {
  return (
    <div className='space-y-6'>
      <AppCard
        title='阶段 3 进行中'
        description='当前已完成新版管理端基础工程与认证骨架，可继续推进核心业务模块迁移。'
        action={<StatusBadge label='继续迁移主链路' variant='success' />}
      >
        <div className='grid gap-4 lg:grid-cols-3'>
          {readinessItems.map((item) => (
            <div
              key={item.title}
              className='rounded-2xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4'
            >
              <p className='text-base font-semibold text-[var(--foreground-primary)]'>{item.title}</p>
              <p className='mt-2 text-sm leading-6 text-[var(--foreground-secondary)]'>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </AppCard>

      <div className='grid gap-6 xl:grid-cols-[1.3fr_0.9fr]'>
        <AppCard title='模块入口' description='核心页面已开始接入真实数据与交互，其余模块按阶段逐步替换占位页面。'>
          <div className='grid gap-3 md:grid-cols-2'>
            {dashboardNavigation.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className='rounded-2xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]'
              >
                <p className='text-sm font-semibold text-[var(--foreground-primary)]'>{item.label}</p>
                <p className='mt-2 text-sm leading-6 text-[var(--foreground-secondary)]'>
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </AppCard>

        <AppCard title='下一步建议' description='按前端改造计划，阶段 3 后续优先补齐其余核心主链路页面。'>
          <ol className='space-y-3 text-sm leading-6 text-[var(--foreground-secondary)]'>
            <li>1. 继续迁移节点、域名、证书与应用记录页面。</li>
            <li>2. 为核心动作补齐确认、反馈与错误提示的一致体验。</li>
            <li>3. 补充模块测试与静态构建回归验证。</li>
          </ol>
        </AppCard>
      </div>
    </div>
  );
}
