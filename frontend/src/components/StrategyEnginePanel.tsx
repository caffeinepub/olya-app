import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, ShieldAlert, Brain } from 'lucide-react';
import type { TranscriptEntry, StrategyRecommendation } from '../hooks/useDashboardState';
import { generateStrategiesFromEntries } from '../utils/strategySimulator';
import { useAddStrategyRecommendation } from '../hooks/useQueries';

interface StrategyEnginePanelProps {
  latestEntry: TranscriptEntry | null;
  entries: TranscriptEntry[];
}

function RLScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 75 ? 'bg-green-500' :
    pct >= 50 ? 'bg-yellow-500' :
    'bg-red-500';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono text-white ${color}`}>
      {pct}%
    </span>
  );
}

export default function StrategyEnginePanel({ latestEntry, entries }: StrategyEnginePanelProps) {
  const [strategies, setStrategies] = useState<StrategyRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const addStrategy = useAddStrategyRecommendation();

  const handleGenerate = async () => {
    if (entries.length === 0) return;
    setIsGenerating(true);
    try {
      // Simulate async generation
      await new Promise((r) => setTimeout(r, 400));
      const trustLevel = 50; // Could be derived from beliefState if passed as prop
      const persuasionScore = 0;
      const generated = generateStrategiesFromEntries(entries, trustLevel, persuasionScore);
      setStrategies(generated);

      // Save top strategy to backend
      if (generated.length > 0) {
        await addStrategy.mutateAsync({
          sessionId: 'current',
          strategy: generated[0].strategy,
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!latestEntry && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No data available. Add transcript entries to generate strategies.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold">LLaMA+RL Strategy Engine</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5"
          onClick={handleGenerate}
          disabled={isGenerating || entries.length === 0}
        >
          {isGenerating ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </div>

      {/* Strategies list */}
      {strategies.length > 0 ? (
        <div className="space-y-2">
          {strategies.map((s, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-muted/30 p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{s.strategy}</span>
                <RLScoreBadge score={s.confidence} />
              </div>
              {s.rationale && (
                <p className="text-xs text-muted-foreground">{s.rationale}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-20 gap-2 text-muted-foreground">
          <Sparkles className="w-5 h-5 opacity-40" />
          <p className="text-xs">Click Generate to produce RL-ranked strategies</p>
        </div>
      )}

      {/* Ethics guard notice */}
      {latestEntry && latestEntry.toxicityFlags.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-2">
          <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">
            Ethics violation detected. Strategies filtered for compliance.
          </p>
        </div>
      )}
    </div>
  );
}
