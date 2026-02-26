import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { TranscriptEntry, EmotionScore, IntentScore } from '../hooks/useDashboardState';

interface EmotionIntentPanelProps {
  latestEntry: TranscriptEntry | null;
  entries: TranscriptEntry[];
}

const EMOTION_COLORS: Record<string, string> = {
  anger: 'bg-red-500',
  fear: 'bg-orange-500',
  sadness: 'bg-blue-400',
  joy: 'bg-yellow-400',
  surprise: 'bg-purple-400',
  disgust: 'bg-green-700',
  neutral: 'bg-slate-400',
  trust: 'bg-teal-500',
  anticipation: 'bg-amber-400',
};

const INTENT_COLORS: Record<string, string> = {
  'information-seeking': 'bg-blue-500',
  negotiating: 'bg-indigo-500',
  persuading: 'bg-violet-500',
  threatening: 'bg-red-600',
  cooperating: 'bg-green-500',
  deflecting: 'bg-orange-400',
  acknowledging: 'bg-teal-400',
  clarifying: 'bg-cyan-500',
};

const SPEAKER_COLORS: Record<string, string> = {
  Operator: 'bg-primary text-primary-foreground',
  Subject: 'bg-secondary text-secondary-foreground',
  Witness: 'bg-accent text-accent-foreground',
  Unknown: 'bg-muted text-muted-foreground',
};

export default function EmotionIntentPanel({ latestEntry, entries }: EmotionIntentPanelProps) {
  if (!latestEntry) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No analysis data yet. Add transcript entries to begin.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Speaker tag */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Latest speaker:</span>
        <Badge className={`text-xs ${SPEAKER_COLORS[latestEntry.speaker] ?? SPEAKER_COLORS.Unknown}`}>
          {latestEntry.speaker}
        </Badge>
      </div>

      {/* Emotions */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Emotions</p>
        <div className="space-y-2">
          {latestEntry.emotions.map((e: EmotionScore) => (
            <div key={e.emotionType} className="flex items-center gap-2">
              <span className="text-xs w-24 truncate capitalize">{e.emotionType}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${EMOTION_COLORS[e.emotionType] ?? 'bg-slate-500'}`}
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
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Intents</p>
        <div className="space-y-2">
          {latestEntry.intents.map((i: IntentScore) => (
            <div key={i.intentType} className="flex items-center gap-2">
              <span className="text-xs w-24 truncate capitalize">{i.intentType.replace(/-/g, ' ')}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${INTENT_COLORS[i.intentType] ?? 'bg-slate-500'}`}
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

      {/* Recent entries summary */}
      {entries.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Recent Entries
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {entries
              .slice(-5)
              .reverse()
              .map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs py-1 border-b border-border last:border-0"
                >
                  <Badge
                    className={`text-xs shrink-0 ${SPEAKER_COLORS[entry.speaker] ?? SPEAKER_COLORS.Unknown}`}
                  >
                    {entry.speaker}
                  </Badge>
                  <span className="text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="truncate flex-1">{entry.text.slice(0, 40)}{entry.text.length > 40 ? '…' : ''}</span>
                  <Badge variant="outline" className="text-xs shrink-0 capitalize">
                    {entry.emotions[0]?.emotionType ?? 'neutral'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs shrink-0 capitalize">
                    {(entry.intents[0]?.intentType ?? 'acknowledging').replace(/-/g, ' ')}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
