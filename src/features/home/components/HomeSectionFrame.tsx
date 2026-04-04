import { ReactNode } from 'react';

interface HomeSectionFrameProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function HomeSectionFrame({ title, subtitle, actions, children }: HomeSectionFrameProps) {
  return (
    <section className="glass rounded-3xl p-8 border border-white/5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-serif italic mb-3">{title}</h2>
          <p className="text-sm text-on-surface-variant max-w-2xl">{subtitle}</p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
