import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { TranscriptEntry, EmotionScore, IntentScore, ToxicityFlag } from '../hooks/useDashboardState';

interface SemanticAnalysisPanelProps {
  entries: TranscriptEntry[];
}

const EMOTION_BADGE_COLORS: Record<string, string> = {
  anger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  fear: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  sadness: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  joy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  surprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  disgust: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  trust: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  anticipation: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

const INTENT_BADGE_COLORS: Record<string, string> = {
  'information-seeking': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  negotiating: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  persuading: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  threatening: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cooperating: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  deflecting: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  acknowledging: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  clarifying: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  statement: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

export default function SemanticAnalysisPanel({ entries }: SemanticAnalysisPanelProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No semantic data yet. Add transcript entries to begin.
      </div>
    );
  }

  // Aggregate emotion distribution
  const emotionDist = entries.reduce<Record<string, number>>((acc, entry) => {
    for (const em of entry.emotions) {
      acc[em.emotionType] = (acc[em.emotionType] ?? 0) + 1;
    }
    return acc;
  }, {});

  // Aggregate intent distribution
  const intentDist = entries.reduce<Record<string, number>>((acc, entry) => {
    for (const i of entry.intents) {
      acc[i.intentType] = (acc[i.intentType] ?? 0) + 1;
    }
    return acc;
  }, {});

  // Unique toxicity flag types
  const toxicityTypes = Array.from(
    new Set(entries.flatMap((e) => e.toxicityFlags.map((f: ToxicityFlag) => f.flagType)))
  );

  const latestEntry = entries[entries.length - 1];

  return (
    <div className="space-y-4">
      {/* Latest entry analysis */}
      {latestEntry && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Latest Entry Analysis
          </p>
          <div className="space-y-3">
            {/* Emotions */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Emotions</p>
              <div className="flex flex-wrap gap-1">
                {latestEntry.emotions.map((em: EmotionScore) => (
                  <span
                    key={em.emotionType}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      EMOTION_BADGE_COLORS[em.emotionType] ?? EMOTION_BADGE_COLORS.neutral
                    }`}
                  >
                    {em.emotionType}{' '}
                    <span className="opacity-70">{Math.round(em.confidence * 100)}%</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Intents */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Intents</p>
              <div className="flex flex-wrap gap-1">
                {latestEntry.intents.map((i: IntentScore) => (
                  <span
                    key={i.intentType}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      INTENT_BADGE_COLORS[i.intentType] ?? INTENT_BADGE_COLORS.statement
                    }`}
                  >
                    {i.intentType.replace(/-/g, ' ')}{' '}
                    <span className="opacity-70">{Math.round(i.confidence * 100)}%</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Toxicity flags */}
            {latestEntry.toxicityFlags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Toxicity Flags</p>
                <div className="flex flex-wrap gap-1">
                  {latestEntry.toxicityFlags.map((f: ToxicityFlag) => (
                    <span
                      key={f.flagType}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    >
                      {f.flagType}{' '}
                      <span className="opacity-70">{Math.round(f.confidence * 100)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session-wide distributions */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Session Distribution
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Top Emotions</p>
            <div className="space-y-1">
              {Object.entries(emotionDist)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([emotion, count]) => (
                  <div key={emotion} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{emotion}</span>
                    <Badge variant="outline" className="text-xs h-4 px-1">{count}</Badge>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Top Intents</p>
            <div className="space-y-1">
              {Object.entries(intentDist)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([intent, count]) => (
                  <div key={intent} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{intent.replace(/-/g, ' ')}</span>
                    <Badge variant="outline" className="text-xs h-4 px-1">{count}</Badge>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toxicity summary */}
      {toxicityTypes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Detected Toxicity Types
          </p>
          <div className="flex flex-wrap gap-1">
            {toxicityTypes.map((type) => (
              <Badge key={type} variant="destructive" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
