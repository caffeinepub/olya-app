import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react';
import type { TranscriptEntry, BeliefState } from '../hooks/useDashboardState';

interface SessionSummaryBarProps {
  entries: TranscriptEntry[];
  beliefState: BeliefState;
}

export default function SessionSummaryBar({ entries, beliefState }: SessionSummaryBarProps) {
  const exchangeCount = entries.length;

  const dominantEmotion =
    entries.length > 0
      ? (() => {
          const counts: Record<string, number> = {};
          for (const e of entries) {
            const top = e.emotions[0]?.emotionType ?? 'neutral';
            counts[top] = (counts[top] ?? 0) + 1;
          }
          return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'neutral';
        })()
      : 'neutral';

  const topStrategy =
    entries.length > 0
      ? entries[entries.length - 1]?.strategies[0]?.strategy ?? 'None'
      : 'None';

  const biasIncidents = entries.filter((e) => e.toxicityFlags.length > 0).length;

  const healthScore = Math.max(
    0,
    Math.min(100, beliefState.trustLevel - biasIncidents * 5)
  );

  const healthColor =
    healthScore >= 70 ? 'text-green-500' :
    healthScore >= 40 ? 'text-yellow-500' :
    'text-red-500';

  const biasColor =
    biasIncidents === 0 ? 'text-green-500' :
    biasIncidents <= 3 ? 'text-yellow-500' :
    'text-red-500';

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Health Score */}
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Health</span>
          <span className={`text-sm font-bold ${healthColor}`}>{healthScore}%</span>
        </div>

        <div className="w-px h-4 bg-border hidden sm:block" />

        {/* Exchange Count */}
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Exchanges</span>
          <span className="text-sm font-bold">{exchangeCount}</span>
        </div>

        <div className="w-px h-4 bg-border hidden sm:block" />

        {/* Dominant Emotion */}
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Emotion</span>
          <Badge variant="secondary" className="text-xs capitalize">{dominantEmotion}</Badge>
        </div>

        <div className="w-px h-4 bg-border hidden sm:block" />

        {/* Top Strategy */}
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Strategy</span>
          <span className="text-xs font-medium truncate max-w-32">{topStrategy}</span>
        </div>

        <div className="w-px h-4 bg-border hidden sm:block" />

        {/* Bias Incidents */}
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Bias</span>
          <span className={`text-sm font-bold ${biasColor}`}>{biasIncidents}</span>
        </div>
      </div>
    </div>
  );
}
