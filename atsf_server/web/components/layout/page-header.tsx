interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className='space-y-3'>
      <p className='text-sm font-medium uppercase tracking-[0.24em] text-[var(--brand-primary)]'>ATSFlare</p>
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight text-[var(--foreground-primary)]'>{title}</h1>
        <p className='max-w-3xl text-sm leading-7 text-[var(--foreground-secondary)]'>
          {description}
        </p>
      </div>
    </div>
  );
}
