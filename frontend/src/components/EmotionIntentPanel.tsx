import React from 'react';
import { Brain, Target, TrendingUp, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { TranscriptEntry } from '@/hooks/useDashboardState';
import { SPEAKER_COLORS, type SpeakerRole } from '@/components/TranscriptInput';
import { cn } from '@/lib/utils';

interface EmotionIntentPanelProps {
  latestEntry: TranscriptEntry | null;
  entries: TranscriptEntry[];
}

const EMOTION_COLORS: Record<string, string> = {
  anger: 'bg-red-500',
  fear: 'bg-purple-500',
  sadness: 'bg-blue-500',
  joy: 'bg-yellow-500',
  surprise: 'bg-orange-500',
  disgust: 'bg-green-600',
  neutral: 'bg-slate-500',
  statement: 'bg-slate-400',
};

const INTENT_COLORS: Record<string, string> = {
  'request-help': 'bg-sky-500',
  'express-grievance': 'bg-orange-500',
  'make-threat': 'bg-red-600',
  'seek-information': 'bg-blue-500',
  negotiate: 'bg-emerald-500',
  'deny-accusation': 'bg-amber-500',
  cooperate: 'bg-teal-500',
  statement: 'bg-slate-500',
};

function SpeakerTag({ speaker }: { speaker: SpeakerRole }) {
  const colorClass = SPEAKER_COLORS[speaker] ?? SPEAKER_COLORS.Unknown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border',
        colorClass
      )}
    >
      <User className="w-3 h-3" />
      {speaker}
    </span>
  );
}

export default function EmotionIntentPanel({
  latestEntry,
  entries,
}: EmotionIntentPanelProps) {
  if (!latestEntry) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
        <Brain className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground/60">
          Awaiting transcript input…
        </p>
        <p className="text-xs text-muted-foreground/40 mt-1">
          Emotion and intent analysis will appear here.
        </p>
      </div>
    );
  }

  const recentEntries = entries.slice(-3).reverse();

  return (
    <div className="flex flex-col gap-4 p-3 h-full overflow-y-auto">
      {/* Latest analysis */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
            Latest Analysis
          </span>
          <SpeakerTag speaker={latestEntry.speaker as SpeakerRole} />
        </div>

        {/* Emotions */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Brain className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Emotions</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {latestEntry.emotions.map((e) => (
              <div key={e.emotionType} className="flex items-center gap-2">
                <span className="text-xs w-24 text-foreground/80 capitalize">
                  {e.emotionType}
                </span>
                <div className="flex-1 relative h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={cn(
                      'absolute left-0 top-0 h-full rounded-full transition-all duration-500',
                      EMOTION_COLORS[e.emotionType] ?? 'bg-slate-500'
                    )}
                    style={{ width: `${Math.round(e.confidence * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round(e.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Intents */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Intents</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {latestEntry.intents.map((i) => (
              <div key={i.intentType} className="flex items-center gap-2">
                <span className="text-xs w-24 text-foreground/80 capitalize">
                  {i.intentType.replace(/-/g, ' ')}
                </span>
                <div className="flex-1 relative h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={cn(
                      'absolute left-0 top-0 h-full rounded-full transition-all duration-500',
                      INTENT_COLORS[i.intentType] ?? 'bg-slate-500'
                    )}
                    style={{ width: `${Math.round(i.confidence * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round(i.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent entries summary */}
      {recentEntries.length > 1 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Recent Entries
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {recentEntries.slice(1).map((entry) => (
              <div
                key={entry.id}
                className="rounded-md border border-border/30 bg-card/30 p-2 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <SpeakerTag speaker={entry.speaker as SpeakerRole} />
                  <span className="text-xs text-muted-foreground/50">
                    {entry.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {entry.emotions[0] && (
                    <Badge
                      variant="outline"
                      className="text-xs border-border/40 text-foreground/60"
                    >
                      {entry.emotions[0].emotionType}
                    </Badge>
                  )}
                  {entry.intents[0] && (
                    <Badge
                      variant="outline"
                      className="text-xs border-border/40 text-foreground/60"
                    >
                      {entry.intents[0].intentType.replace(/-/g, ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
