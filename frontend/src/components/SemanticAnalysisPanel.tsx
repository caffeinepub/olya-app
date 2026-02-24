import React from 'react';
import { Brain, Hash, Tag, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TranscriptEntry } from '@/hooks/useDashboardState';
import { cn } from '@/lib/utils';

interface SemanticAnalysisPanelProps {
  entries: TranscriptEntry[];
}

const EMOTION_BADGE_COLORS: Record<string, string> = {
  anger: 'border-red-500/40 text-red-400 bg-red-500/5',
  fear: 'border-purple-500/40 text-purple-400 bg-purple-500/5',
  sadness: 'border-blue-500/40 text-blue-400 bg-blue-500/5',
  joy: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/5',
  surprise: 'border-orange-500/40 text-orange-400 bg-orange-500/5',
  disgust: 'border-green-600/40 text-green-500 bg-green-600/5',
  neutral: 'border-slate-500/40 text-slate-400 bg-slate-500/5',
  statement: 'border-slate-400/40 text-slate-400 bg-slate-400/5',
};

const INTENT_BADGE_COLORS: Record<string, string> = {
  'request-help': 'border-sky-500/40 text-sky-400 bg-sky-500/5',
  'express-grievance': 'border-orange-500/40 text-orange-400 bg-orange-500/5',
  'make-threat': 'border-red-600/40 text-red-500 bg-red-600/5',
  'seek-information': 'border-blue-500/40 text-blue-400 bg-blue-500/5',
  negotiate: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5',
  'deny-accusation': 'border-amber-500/40 text-amber-400 bg-amber-500/5',
  cooperate: 'border-teal-500/40 text-teal-400 bg-teal-500/5',
  statement: 'border-slate-500/40 text-slate-400 bg-slate-500/5',
};

export default function SemanticAnalysisPanel({ entries }: SemanticAnalysisPanelProps) {
  const latest = entries[entries.length - 1];

  // Aggregate emotion counts across all entries
  const emotionCounts = entries.reduce<Record<string, number>>((acc, e) => {
    for (const em of e.emotions) {
      acc[em.emotionType] = (acc[em.emotionType] ?? 0) + 1;
    }
    return acc;
  }, {});

  // Aggregate intent counts across all entries
  const intentCounts = entries.reduce<Record<string, number>>((acc, e) => {
    for (const i of e.intents) {
      acc[i.intentType] = (acc[i.intentType] ?? 0) + 1;
    }
    return acc;
  }, {});

  // Collect all toxicity flag types
  const toxicityTypes = Array.from(
    new Set(entries.flatMap((e) => e.toxicityFlags.map((f) => f.flagType)))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
        <Brain className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          Semantic Analysis
        </span>
      </div>

      <ScrollArea className="flex-1">
        {!latest ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/40 px-4 text-center">
            <Brain className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-mono">NLP engine standby</p>
            <p className="text-[10px] font-mono mt-1 opacity-60">
              Awaiting transcript input
            </p>
          </div>
        ) : (
          <div className="p-3 flex flex-col gap-4">
            {/* Latest entry analysis */}
            <div className="rounded-lg border border-border/30 bg-card/30 p-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-2">
                Latest Entry
              </p>

              {/* Emotions */}
              {latest.emotions.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Brain className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground/60">Emotions</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {latest.emotions.map((em) => (
                      <Badge
                        key={em.emotionType}
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          EMOTION_BADGE_COLORS[em.emotionType] ?? EMOTION_BADGE_COLORS.neutral
                        )}
                      >
                        {em.emotionType}{' '}
                        <span className="opacity-60 ml-1">
                          {Math.round(em.confidence * 100)}%
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Intents */}
              {latest.intents.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Tag className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground/60">Intents</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {latest.intents.map((i) => (
                      <Badge
                        key={i.intentType}
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          INTENT_BADGE_COLORS[i.intentType] ?? INTENT_BADGE_COLORS.statement
                        )}
                      >
                        {i.intentType.replace(/-/g, ' ')}{' '}
                        <span className="opacity-60 ml-1">
                          {Math.round(i.confidence * 100)}%
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Toxicity flags */}
              {latest.toxicityFlags.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <Hash className="w-3 h-3 text-destructive/60" />
                    <span className="text-[10px] text-destructive/60">Flags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {latest.toxicityFlags.map((f) => (
                      <Badge
                        key={f.flagType}
                        variant="outline"
                        className="text-[10px] border-destructive/40 text-destructive bg-destructive/5"
                      >
                        {f.flagType}{' '}
                        <span className="opacity-60 ml-1">
                          {Math.round(f.confidence * 100)}%
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Session-wide emotion distribution */}
            {entries.length > 1 && Object.keys(emotionCounts).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                    Session Emotion Distribution
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(emotionCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([emotion, count]) => (
                      <div key={emotion} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/70 w-24 capitalize truncate">
                          {emotion}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-primary/60"
                            style={{ width: `${(count / entries.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground/50 w-4 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Session-wide intent distribution */}
            {entries.length > 1 && Object.keys(intentCounts).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                    Session Intent Distribution
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(intentCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([intent, count]) => (
                      <Badge
                        key={intent}
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          INTENT_BADGE_COLORS[intent] ?? INTENT_BADGE_COLORS.statement
                        )}
                      >
                        {intent.replace(/-/g, ' ')}
                        <span className="opacity-60 ml-1">×{count}</span>
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Toxicity summary */}
            {toxicityTypes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Hash className="w-3.5 h-3.5 text-destructive/60" />
                  <span className="text-[10px] font-mono text-destructive/60 uppercase tracking-wider">
                    Session Flags
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {toxicityTypes.map((ft) => (
                    <Badge
                      key={ft}
                      variant="outline"
                      className="text-[10px] border-destructive/40 text-destructive bg-destructive/5"
                    >
                      {ft}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
