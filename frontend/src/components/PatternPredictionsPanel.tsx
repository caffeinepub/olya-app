import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { TranscriptEntry } from '@/hooks/useDashboardState';
import type { PatternProfile } from '@/utils/patternPredictionEngine';
import { predictNextPattern } from '@/utils/patternPredictionEngine';
import { checkForHallucination } from '@/utils/hallucinationGuard';
import { enforceEthics, formatViolationType } from '@/utils/ethicalConstraints';
import { cn } from '@/lib/utils';

interface PatternPredictionsPanelProps {
  entries: TranscriptEntry[];
  profile: PatternProfile | null;
}

function VerifyBadge({ suspectPhrases }: { suspectPhrases: Array<{ phrase: string; reason: string }> }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber/40 bg-amber/10 text-amber text-[9px] font-mono font-semibold hover:bg-amber/20 transition-colors">
          <AlertTriangle size={9} />
          Verify
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 text-xs" side="top">
        <p className="font-semibold mb-1.5 text-amber">Suspect Phrases</p>
        {suspectPhrases.map((sp, i) => (
          <div key={i} className="mb-1.5 last:mb-0">
            <p className="font-mono text-foreground/80">"{sp.phrase}"</p>
            <p className="text-muted-foreground/70 text-[10px]">{sp.reason}</p>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function WithheldNotice({ violationType }: { violationType: string | null }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-muted/20 border border-border/40">
      <ShieldAlert size={12} className="text-muted-foreground/60 shrink-0" />
      <span className="text-[10px] font-mono text-muted-foreground/60 italic">
        Content withheld – ethical constraint triggered
        {violationType && `: ${formatViolationType(violationType as Parameters<typeof formatViolationType>[0])}`}
      </span>
    </div>
  );
}

const DIRECTION_CONFIG = {
  escalating: {
    icon: <TrendingUp size={14} className="text-red-400" />,
    label: 'Escalating',
    color: 'text-red-400',
    barColor: 'bg-red-500',
  },
  'de-escalating': {
    icon: <TrendingDown size={14} className="text-green-400" />,
    label: 'De-escalating',
    color: 'text-green-400',
    barColor: 'bg-green-500',
  },
  stable: {
    icon: <Minus size={14} className="text-amber" />,
    label: 'Stable',
    color: 'text-amber',
    barColor: 'bg-amber-500',
  },
};

const URGENCY_CONFIG = {
  immediate: { color: 'text-red-400', dot: 'bg-red-400' },
  soon: { color: 'text-amber', dot: 'bg-amber-400' },
  monitor: { color: 'text-green-400', dot: 'bg-green-400' },
};

export default function PatternPredictionsPanel({
  entries,
  profile,
}: PatternPredictionsPanelProps) {
  const contextTexts = useMemo(
    () => entries.slice(-5).map((e) => e.text),
    [entries]
  );

  const prediction = useMemo(() => {
    if (entries.length < 3) return null;
    return predictNextPattern(entries, profile);
  }, [entries, profile]);

  if (entries.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4 gap-3">
        <Loader2 className="w-6 h-6 text-muted-foreground/30 animate-spin" />
        <p className="text-xs font-mono text-muted-foreground/50">Building pattern baseline…</p>
        <p className="text-[10px] font-mono text-muted-foreground/30">
          {3 - entries.length} more {3 - entries.length === 1 ? 'entry' : 'entries'} needed
        </p>
      </div>
    );
  }

  if (!prediction) return null;

  // Run hallucination guard on prediction texts
  const emotionHallucination = checkForHallucination(
    `Next emotion: ${prediction.nextEmotion.label}`,
    contextTexts
  );
  const intentHallucination = checkForHallucination(
    `Next intent: ${prediction.nextIntent.label}`,
    contextTexts
  );
  const directionHallucination = checkForHallucination(
    prediction.negotiationDirectionReasoning,
    contextTexts
  );
  const windowHallucination = checkForHallucination(
    prediction.deescalationWindow.reasoning,
    contextTexts
  );

  // Run ethical constraints on prediction texts
  const directionEthics = enforceEthics(prediction.negotiationDirectionReasoning);
  const windowEthics = enforceEthics(prediction.deescalationWindow.reasoning);

  const directionConfig = DIRECTION_CONFIG[prediction.negotiationDirection];
  const urgencyConfig = URGENCY_CONFIG[prediction.deescalationWindow.urgency];

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto">
      {/* Next Emotion */}
      <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/70">
            Next Emotion
          </span>
          {emotionHallucination.flagged && (
            <VerifyBadge suspectPhrases={emotionHallucination.suspectPhrases} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground capitalize">
            {prediction.nextEmotion.label}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/60">
            {Math.round(prediction.nextEmotion.confidence * 100)}% confidence
          </span>
        </div>
        <div className="mt-1.5">
          <Progress value={prediction.nextEmotion.confidence * 100} className="h-1" />
        </div>
      </div>

      {/* Next Intent */}
      <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/70">
            Next Intent
          </span>
          {intentHallucination.flagged && (
            <VerifyBadge suspectPhrases={intentHallucination.suspectPhrases} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground capitalize">
            {prediction.nextIntent.label.replace(/-/g, ' ')}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/60">
            {Math.round(prediction.nextIntent.confidence * 100)}% confidence
          </span>
        </div>
        <div className="mt-1.5">
          <Progress value={prediction.nextIntent.confidence * 100} className="h-1" />
        </div>
      </div>

      {/* Negotiation Direction */}
      <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/70">
            Conversation Direction
          </span>
          {directionHallucination.flagged && (
            <VerifyBadge suspectPhrases={directionHallucination.suspectPhrases} />
          )}
        </div>
        <div className="flex items-center gap-2 mb-1">
          {directionConfig.icon}
          <span className={cn('text-sm font-semibold', directionConfig.color)}>
            {directionConfig.label}
          </span>
        </div>
        {directionEthics.isViolation ? (
          <WithheldNotice violationType={directionEthics.violationType} />
        ) : (
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
            {prediction.negotiationDirectionReasoning}
          </p>
        )}
      </div>

      {/* De-escalation Window */}
      <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/70">
            Action Window
          </span>
          {windowHallucination.flagged && (
            <VerifyBadge suspectPhrases={windowHallucination.suspectPhrases} />
          )}
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <div className={cn('w-1.5 h-1.5 rounded-full', urgencyConfig.dot)} />
          <span className={cn('text-xs font-semibold font-mono', urgencyConfig.color)}>
            {prediction.deescalationWindow.timing}
          </span>
        </div>
        {windowEthics.isViolation ? (
          <WithheldNotice violationType={windowEthics.violationType} />
        ) : (
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
            {prediction.deescalationWindow.reasoning}
          </p>
        )}
      </div>
    </div>
  );
}
