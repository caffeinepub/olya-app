import React from 'react';
import {
  Activity,
  MessageSquare,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SessionMetrics {
  healthScore: number;
  exchangeCount: number;
  dominantEmotion: string;
  topStrategy: string;
  biasCount?: number;
}

interface SessionSummaryBarProps {
  metrics: SessionMetrics;
  sessionName?: string;
  isReadOnly?: boolean;
}

function HealthGauge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'oklch(0.65 0.18 145)'
      : score >= 40
      ? 'oklch(0.75 0.18 55)'
      : 'oklch(0.62 0.22 25)';
  const TrendIcon =
    score >= 70 ? TrendingUp : score >= 40 ? Minus : TrendingDown;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="oklch(0.28 0.04 220)"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${score} 100`}
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[9px] font-mono font-bold"
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider">
          Health
        </p>
        <div className="flex items-center gap-1">
          <TrendIcon size={10} style={{ color }} />
          <span
            className="text-[10px] font-mono font-semibold"
            style={{ color }}
          >
            {score >= 70 ? 'Stable' : score >= 40 ? 'Caution' : 'Critical'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SessionSummaryBar({
  metrics,
  sessionName,
  isReadOnly,
}: SessionSummaryBarProps) {
  const biasCount = metrics.biasCount ?? 0;
  const biasColor =
    biasCount === 0
      ? 'text-green-400'
      : biasCount <= 3
      ? 'text-amber'
      : 'text-red-400';

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 bg-navy/80 border-b border-border/50 backdrop-blur-sm">
      <HealthGauge score={metrics.healthScore} />

      <div className="w-px h-8 bg-border/50" />

      <div className="flex items-center gap-4 flex-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={12} className="text-teal/60" />
          <div>
            <p className="text-[9px] font-mono text-muted-foreground/60">
              Exchanges
            </p>
            <p className="text-sm font-mono font-bold text-foreground">
              {metrics.exchangeCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-amber/60" />
          <div>
            <p className="text-[9px] font-mono text-muted-foreground/60">
              Dominant Emotion
            </p>
            <p className="text-xs font-mono font-semibold text-foreground">
              {metrics.dominantEmotion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <AlertTriangle size={12} className={cn('shrink-0', biasColor)} />
          <div>
            <p className="text-[9px] font-mono text-muted-foreground/60">
              Bias Incidents
            </p>
            <p className={cn('text-sm font-mono font-bold', biasColor)}>
              {biasCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Zap size={12} className="text-teal/60 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-mono text-muted-foreground/60">
              Top Strategy
            </p>
            <p className="text-xs font-mono font-semibold text-foreground truncate">
              {metrics.topStrategy}
            </p>
          </div>
        </div>
      </div>

      <div className="w-px h-8 bg-border/50" />

      <div className="flex items-center gap-2">
        {isReadOnly && (
          <span className="px-2 py-0.5 rounded border border-amber/30 bg-amber/10 text-amber text-[9px] font-mono">
            READ-ONLY
          </span>
        )}
        {sessionName && (
          <span className="text-[10px] font-mono text-muted-foreground/60 max-w-32 truncate">
            {sessionName}
          </span>
        )}
        <div className="flex items-center gap-1">
          <div className="status-dot" />
          <span className="text-[9px] font-mono text-teal/70">LIVE</span>
        </div>
      </div>
    </div>
  );
}
