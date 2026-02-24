import React, { useEffect, useRef } from 'react';
import { Clock, User, AlertTriangle, Brain, ShieldX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TranscriptEntry } from '@/hooks/useDashboardState';
import { SPEAKER_COLORS, type SpeakerRole } from '@/components/TranscriptInput';
import { enforceEthics, formatViolationType } from '@/utils/ethicalConstraints';
import { cn } from '@/lib/utils';

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

function EthicsBadgeInline({ flags }: { flags: TranscriptEntry['toxicityFlags'] }) {
  if (flags.length === 0) {
    return (
      <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-400 bg-emerald-500/5">
        ✓ Clean
      </Badge>
    );
  }
  const top = flags[0];
  return (
    <Badge variant="outline" className="text-xs border-destructive/40 text-destructive bg-destructive/5">
      <AlertTriangle className="w-3 h-3 mr-1" />
      {top.flagType} ({Math.round(top.confidence * 100)}%)
    </Badge>
  );
}

function EmotionBadge({ emotions }: { emotions: TranscriptEntry['emotions'] }) {
  if (emotions.length === 0) return null;
  const top = emotions[0];

  const emotionColors: Record<string, string> = {
    anger: 'border-red-500/40 text-red-400 bg-red-500/5',
    fear: 'border-purple-500/40 text-purple-400 bg-purple-500/5',
    sadness: 'border-blue-500/40 text-blue-400 bg-blue-500/5',
    joy: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/5',
    surprise: 'border-orange-500/40 text-orange-400 bg-orange-500/5',
    disgust: 'border-green-500/40 text-green-400 bg-green-500/5',
    neutral: 'border-slate-500/40 text-slate-400 bg-slate-500/5',
  };

  const colorClass = emotionColors[top.emotionType] ?? emotionColors.neutral;

  return (
    <Badge variant="outline" className={cn('text-xs', colorClass)}>
      <Brain className="w-3 h-3 mr-1" />
      {top.emotionType} ({Math.round(top.confidence * 100)}%)
    </Badge>
  );
}

export default function TranscriptPanel({ entries }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (entries.length === 0) return;
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
    return () => clearTimeout(timer);
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
          <User className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground/70">No transcript entries yet.</p>
        <p className="text-xs text-muted-foreground/40 mt-1">
          Type or speak to add entries.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        <div className="flex flex-col gap-2 p-3">
          {entries.map((entry) => {
            const speakerColor = SPEAKER_COLORS[entry.speaker as SpeakerRole] ?? SPEAKER_COLORS.Unknown;
            const ethicsResult = enforceEthics(entry.text);
            const displayText = ethicsResult.isViolation
              ? ethicsResult.sanitizedText
              : entry.text;

            return (
              <div
                key={entry.id}
                className={cn(
                  'rounded-lg border bg-card/40 p-3 flex flex-col gap-2 transition-all hover:bg-card/60',
                  ethicsResult.isViolation
                    ? 'border-red-800/50 bg-red-950/10'
                    : 'border-border/40'
                )}
              >
                {/* Header row: speaker + timestamp */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border',
                        speakerColor
                      )}
                    >
                      <User className="w-3 h-3" />
                      {entry.speaker}
                    </span>
                    {ethicsResult.isViolation && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-red-700/60 bg-red-950/40 text-red-300 text-[9px] font-mono font-semibold cursor-help">
                            <ShieldX size={9} />
                            Ethics Violation
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {formatViolationType(ethicsResult.violationType)}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                    <Clock className="w-3 h-3" />
                    {entry.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                {/* Transcript text */}
                <p className="text-sm leading-relaxed text-foreground/90">{displayText}</p>

                {/* Badges row */}
                <div className="flex flex-wrap gap-1.5">
                  <EthicsBadgeInline flags={entry.toxicityFlags} />
                  <EmotionBadge emotions={entry.emotions} />
                  {entry.intents[0] && (
                    <Badge
                      variant="outline"
                      className="text-xs border-primary/30 text-primary/80 bg-primary/5"
                    >
                      {entry.intents[0].intentType}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
          {/* Scroll anchor */}
          <div ref={bottomRef} className="h-1" />
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
}
