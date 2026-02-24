import React from 'react';
import { cn } from '@/lib/utils';

interface PanelContainerProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  active?: boolean;
  variant?: 'default' | 'amber';
}

export default function PanelContainer({
  title,
  icon,
  children,
  className,
  headerRight,
  active = false,
  variant = 'default',
}: PanelContainerProps) {
  return (
    <div
      className={cn(
        'panel-base flex flex-col',
        active && variant === 'default' && 'panel-glow',
        active && variant === 'amber' && 'panel-glow-amber',
        className
      )}
    >
      <div className="panel-header justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className={cn('text-xs', variant === 'amber' ? 'text-amber' : 'text-teal')}>{icon}</span>}
          <span className="panel-label">{title}</span>
          <div className={cn('status-dot', variant === 'amber' && 'status-dot-amber')} />
        </div>
        {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
      </div>
      <div className="flex-1 overflow-hidden relative z-10">
        {children}
      </div>
    </div>
  );
}
