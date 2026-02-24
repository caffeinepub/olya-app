import React from 'react';
import { Zap, CheckCircle, ChevronRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAddStrategyRecommendation } from '@/hooks/useQueries';
import type { TranscriptEntry } from '@/hooks/useDashboardState';
import { checkForHallucination } from '@/utils/hallucinationGuard';
import { enforceEthics, formatViolationType } from '@/utils/ethicalConstraints';
import { cn } from '@/lib/utils';

interface StrategyEnginePanelProps {
  entries: TranscriptEntry[];
  sessionId: string | null;
  usedStrategies: Set<string>;
  onMarkUsed: (key: string) => void;
}

function StrategyCard({
  strategy,
  strategyKey,
  isUsed,
  sessionId,
  onMarkUsed,
  contextTexts,
}: {
  strategy: { strategy: string; confidence: number; rationale: string };
  strategyKey: string;
  isUsed: boolean;
  sessionId: string | null;
  onMarkUsed: (key: string) => void;
  contextTexts: string[];
}) {
  const addRecommendation = useAddStrategyRecommendation();

  // Run ethical constraints check
  const ethicsResult = enforceEthics(strategy.rationale);

  // If ethical violation, block rendering
  if (ethicsResult.isViolation) {
    return (
      <div className="rounded border border-border/40 bg-muted/10 p-2.5">
        <div className="flex items-start gap-2">
          <ShieldAlert size={12} className="text-muted-foreground/50 mt-0.5 shrink-0" />
          <p className="text-[10px] font-mono text-muted-foreground/60 italic">
            Content withheld – ethical constraint triggered:{' '}
            <span className="font-semibold">{formatViolationType(ethicsResult.violationType)}</span>
          </p>
        </div>
      </div>
    );
  }

  // Run hallucination guard
  const hallucinationResult = checkForHallucination(
    `${strategy.strategy}: ${strategy.rationale}`,
    contextTexts
  );

  const handleMarkUsed = async () => {
    onMarkUsed(strategyKey);
    if (sessionId) {
      try {
        await addRecommendation.mutateAsync({
          sessionId,
          recommendation: {
            strategy: strategy.strategy,
            confidence: strategy.confidence,
            rationale: strategy.rationale,
          },
        });
      } catch {
        // Silent fail — local state already updated
      }
    }
  };

  return (
    <div
      className={cn(
        'rounded border p-2.5 transition-all',
        isUsed
          ? 'bg-green-950/20 border-green-900/40 opacity-70'
          : 'bg-navy/40 border-border/50 hover:border-teal/30'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs font-semibold text-foreground">
          {strategy.strategy}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {hallucinationResult.flagged && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber/40 bg-amber/10 text-amber text-[9px] font-mono font-semibold hover:bg-amber/20 transition-colors">
                  <AlertTriangle size={9} />
                  Verify
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1.5 p-1.5 rounded bg-amber/5 border border-amber/20 text-[9px] font-mono space-y-1">
                  <p className="text-amber font-semibold">Suspect phrases:</p>
                  {hallucinationResult.suspectPhrases.map((sp, i) => (
                    <div key={i}>
                      <span className="text-foreground/70">"{sp.phrase}"</span>
                      <span className="text-muted-foreground/60"> — {sp.reason}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          <span className="text-[10px] font-mono font-bold text-teal">
            {(strategy.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="h-0.5 bg-muted/20 rounded-full mb-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${strategy.confidence * 100}%`,
            background:
              strategy.confidence > 0.8
                ? 'oklch(0.72 0.18 185)'
                : strategy.confidence > 0.6
                ? 'oklch(0.75 0.18 55)'
                : 'oklch(0.55 0.04 200)',
          }}
        />
      </div>

      <p className="text-[10px] text-muted-foreground/80 leading-relaxed mb-2">
        {strategy.rationale}
      </p>

      {!isUsed ? (
        <Button
          size="sm"
          onClick={handleMarkUsed}
          disabled={addRecommendation.isPending}
          className="h-6 text-[10px] font-mono bg-teal/10 hover:bg-teal/20 border border-teal/30 text-teal px-2"
          variant="ghost"
        >
          <ChevronRight size={10} className="mr-1" />
          {addRecommendation.isPending ? 'Saving...' : 'Mark as Used'}
        </Button>
      ) : (
        <div className="flex items-center gap-1 text-[10px] font-mono text-green-400">
          <CheckCircle size={10} />
          <span>Applied</span>
        </div>
      )}
    </div>
  );
}

export default function StrategyEnginePanel({
  entries,
  sessionId,
  usedStrategies,
  onMarkUsed,
}: StrategyEnginePanelProps) {
  const latest = entries[entries.length - 1];
  const strategies = latest?.strategyRecommendations ?? [];
  const contextTexts = entries.slice(-5).map((e) => e.text);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
        <Zap className="w-3.5 h-3.5 text-amber/70" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          Strategy Engine
        </span>
        {strategies.length > 0 && (
          <span className="ml-auto text-[9px] font-mono text-muted-foreground/50">
            {strategies.length} generated
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        {!latest ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/40">
            <Zap size={20} className="mb-2 opacity-30" />
            <p className="text-[10px] font-mono">LLM+RL engine standby</p>
            <p className="text-[9px] font-mono mt-1 opacity-60">
              Awaiting dialogue input
            </p>
          </div>
        ) : strategies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-muted-foreground/40">
            <p className="text-[10px] font-mono">No strategies generated yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {strategies.map((strategy, i) => {
              const key = `${strategy.strategy}_${i}`;
              return (
                <StrategyCard
                  key={key}
                  strategy={strategy}
                  strategyKey={key}
                  isUsed={usedStrategies.has(key)}
                  sessionId={sessionId}
                  onMarkUsed={onMarkUsed}
                  contextTexts={contextTexts}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
