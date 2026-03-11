import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { PageHeader } from '@/components/layout/page-header';

export default function DashboardPage() {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='ATSFlare 管理端迁移进度'
        description='新版前端已完成认证与框架层迁移，当前进入阶段 3，优先接入核心业务模块。'
      />
      <DashboardOverview />
    </div>
  );
}
