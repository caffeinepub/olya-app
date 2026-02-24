import React, { useCallback, useMemo, useState } from 'react';
import { Plus, Eye, Loader2, AlertCircle, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import SessionManager from '@/components/SessionManager';
import TranscriptInput, { type SpeakerRole } from '@/components/TranscriptInput';
import TranscriptPanel from '@/components/TranscriptPanel';
import EmotionIntentPanel from '@/components/EmotionIntentPanel';
import BeliefStatePanel from '@/components/BeliefStatePanel';
import PatternPredictionsPanel from '@/components/PatternPredictionsPanel';
import SafetyQualityPanel from '@/components/SafetyQualityPanel';
import SessionSummaryBar from '@/components/SessionSummaryBar';
import { useDashboardState } from '@/hooks/useDashboardState';
import {
  useGetSessionsByTimestamp,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useGetPatternProfile,
} from '@/hooks/useQueries';
import { useActor } from '@/hooks/useActor';
import type { ConversationPattern } from '@/backend';
import { toast } from 'sonner';
import { analyzeEthics } from '@/utils/ethicsSimulator';
import { checkForHallucination } from '@/utils/hallucinationGuard';
import { enforceEthics } from '@/utils/ethicalConstraints';
import { calculateTrustworthinessScore } from '@/utils/trustworthinessScoreCalculator';
import { cn } from '@/lib/utils';

// ─── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden ${className}`}
    >
      <div className="px-3 py-2 border-b border-border/30 bg-card/20 flex items-center gap-2">
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          {title}
        </h3>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const {
    transcriptEntries,
    currentBeliefState,
    latestEntry,
    addTranscriptEntry,
    resetState,
  } = useDashboardState();

  const { actor, isFetching: actorFetching } = useActor();
  const actorReady = !!actor && !actorFetching;

  const { data: sessions = [], isLoading: sessionsLoading } =
    useGetSessionsByTimestamp();
  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();
  const { data: patternProfile } = useGetPatternProfile();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [usedStrategies, setUsedStrategies] = useState<Set<string>>(new Set());

  // Suppress unused variable warning
  void sessions;
  void sessionsLoading;

  // Build patterns from transcript entries for backend
  const buildPatterns = useCallback((): ConversationPattern[] => {
    return transcriptEntries.map((e) => ({
      speakerRole: e.speaker,
      intent: e.intents[0]?.intentType ?? 'statement',
      emotion: e.emotions[0]?.emotionType ?? 'neutral',
      topic: e.text.slice(0, 50),
      occurrence: 1n,
    }));
  }, [transcriptEntries]);

  // Compute safety metrics from current session
  const safetyMetrics = useMemo(() => {
    if (transcriptEntries.length === 0) {
      return {
        biasCount: 0,
        hallucinationFlagRate: 0,
        ethicalViolationCount: 0,
        trustworthinessScore: 100,
      };
    }

    // Bias count from ethics analysis
    let biasCount = 0;
    let ethicalViolationCount = 0;
    let hallucinationFlagCount = 0;
    let totalChecked = 0;

    for (const entry of transcriptEntries) {
      const ethics = analyzeEthics(entry.text);
      if (ethics.status === 'Bias' || ethics.status === 'Potential Bias') {
        biasCount += ethics.biasCategories.length > 0 ? ethics.biasCategories.length : 1;
      }

      const constraint = enforceEthics(entry.text);
      if (constraint.isViolation) {
        ethicalViolationCount += 1;
      }

      // Check strategies for hallucinations
      for (const strategy of entry.strategyRecommendations) {
        const hallucination = checkForHallucination(
          `${strategy.strategy}: ${strategy.rationale}`,
          [entry.text]
        );
        if (hallucination.flagged) hallucinationFlagCount++;
        totalChecked++;
      }
    }

    const hallucinationFlagRate =
      totalChecked > 0 ? (hallucinationFlagCount / totalChecked) * 100 : 0;

    const trustworthinessScore = calculateTrustworthinessScore(
      biasCount,
      hallucinationFlagRate,
      ethicalViolationCount,
      transcriptEntries.length
    );

    return {
      biasCount,
      hallucinationFlagRate,
      ethicalViolationCount,
      trustworthinessScore,
    };
  }, [transcriptEntries]);

  // Session metrics for summary bar
  const sessionMetrics = useMemo(() => {
    const dominantEmotion =
      latestEntry?.emotions[0]?.emotionType ?? 'neutral';
    const topStrategy =
      latestEntry?.strategyRecommendations[0]?.strategy ?? 'None';
    const healthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (currentBeliefState.trustLevel * 50 +
            currentBeliefState.persuasionLevel * 30 +
            20) *
            (1 - safetyMetrics.ethicalViolationCount * 0.05)
        )
      )
    );

    return {
      healthScore,
      exchangeCount: transcriptEntries.length,
      dominantEmotion,
      topStrategy,
      biasCount: safetyMetrics.biasCount,
    };
  }, [latestEntry, currentBeliefState, transcriptEntries.length, safetyMetrics]);

  // Handle new session
  const handleNewSession = useCallback(async () => {
    if (!actorReady) {
      toast.error('Still connecting to the network, please wait a moment.');
      return;
    }

    if (createSessionMutation.isPending) return;

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    try {
      const createdSession = await createSessionMutation.mutateAsync({
        sessionId,
        rawTranscript: '',
      });
      const newId = createdSession?.sessionId ?? sessionId;
      setActiveSessionId(newId);
      setIsReadOnly(false);
      resetState();
      setSaveError(null);
      setUsedStrategies(new Set());
      toast.success('New session created');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create session.';
      setSaveError(message);
      toast.error(`Failed to create session: ${message}`);
    }
  }, [actorReady, createSessionMutation, resetState]);

  // Handle transcript submission
  const handleTranscriptSubmit = useCallback(
    async (text: string, speaker: SpeakerRole) => {
      addTranscriptEntry(text, speaker);

      if (!activeSessionId) return;

      setIsSaving(true);
      setSaveError(null);
      try {
        const rawTranscript = [...transcriptEntries, { text, speaker }]
          .map((e) => `[${'speaker' in e ? e.speaker : speaker}] ${e.text}`)
          .join('\n');
        const patterns = buildPatterns();
        await updateSessionMutation.mutateAsync({
          sessionId: activeSessionId,
          rawTranscript,
          patterns,
        });
      } catch {
        setSaveError('Auto-save failed.');
      } finally {
        setIsSaving(false);
      }
    },
    [addTranscriptEntry, activeSessionId, transcriptEntries, buildPatterns, updateSessionMutation]
  );

  // Handle session selection (read-only view)
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      if (sessionId === activeSessionId && !isReadOnly) return;
      setActiveSessionId(sessionId);
      setIsReadOnly(true);
      resetState();
    },
    [activeSessionId, isReadOnly, resetState]
  );

  // Handle session delete
  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      await deleteSessionMutation.mutateAsync(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setIsReadOnly(false);
        resetState();
      }
    },
    [deleteSessionMutation, activeSessionId, resetState]
  );

  void handleDeleteSession;

  const handleMarkStrategyUsed = useCallback((key: string) => {
    setUsedStrategies((prev) => new Set([...prev, key]));
  }, []);

  const newSessionDisabled = !actorReady || createSessionMutation.isPending;

  // Build pattern profile for predictions panel
  const predictionProfile = useMemo(() => {
    if (!patternProfile) return null;
    return {
      patterns: patternProfile.patterns,
      biases: patternProfile.biases,
      ethicalViolations: patternProfile.ethicalViolations,
    };
  }, [patternProfile]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border/30 bg-card/20 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border/30">
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={handleNewSession}
            disabled={newSessionDisabled}
          >
            {actorFetching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : createSessionMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {actorFetching
              ? 'Connecting…'
              : createSessionMutation.isPending
              ? 'Creating…'
              : 'New Session'}
          </Button>
        </div>

        <SessionManager
          currentSessionId={activeSessionId}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
          isCreating={createSessionMutation.isPending}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Status bar */}
        {(saveError || isSaving) && (
          <div
            className={cn(
              'px-4 py-1.5 text-xs font-mono flex items-center gap-2 border-b border-border/30',
              saveError
                ? 'bg-red-950/30 text-red-400 border-red-900/30'
                : 'bg-teal/5 text-teal/70'
            )}
          >
            {saveError ? (
              <>
                <AlertCircle size={12} />
                {saveError}
              </>
            ) : (
              <>
                <Loader2 size={12} className="animate-spin" />
                Auto-saving…
              </>
            )}
          </div>
        )}

        {activeSessionId ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Session Summary Bar */}
            <SessionSummaryBar
              metrics={sessionMetrics}
              isReadOnly={isReadOnly}
            />

            <div className="flex-1 flex overflow-hidden">
              {/* Left column: input + transcript */}
              <div className="flex flex-col w-72 shrink-0 border-r border-border/30 overflow-hidden">
                {isReadOnly ? (
                  <div className="flex items-center justify-center p-4 border-b border-border/30">
                    <div className="text-center">
                      <Eye size={20} className="mx-auto mb-1 text-muted-foreground/30" />
                      <p className="text-[10px] font-mono text-muted-foreground/50">
                        Read-only session view
                      </p>
                    </div>
                  </div>
                ) : (
                  <TranscriptInput onSubmit={handleTranscriptSubmit} />
                )}
                <Panel title="Live Transcript" className="flex-1 min-h-0 rounded-none border-x-0 border-b-0">
                  <ScrollArea className="h-full">
                    <TranscriptPanel entries={transcriptEntries} />
                  </ScrollArea>
                </Panel>
              </div>

              {/* Center column */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <div className="flex-1 grid grid-rows-3 gap-0 overflow-hidden">
                  <Panel
                    title="Emotion & Intent Analysis"
                    className="border-b border-border/30 rounded-none border-x-0 border-t-0"
                  >
                    <ScrollArea className="h-full">
                      <EmotionIntentPanel
                        latestEntry={latestEntry}
                        entries={transcriptEntries}
                      />
                    </ScrollArea>
                  </Panel>
                  <Panel
                    title="Belief State Graph"
                    className="border-b border-border/30 rounded-none border-x-0"
                  >
                    <BeliefStatePanel
                      entries={transcriptEntries}
                      beliefState={currentBeliefState}
                    />
                  </Panel>
                  <Panel
                    title="Safety & Quality"
                    icon={<Shield size={12} />}
                    className="rounded-none border-x-0 border-b-0"
                  >
                    <SafetyQualityPanel
                      biasCount={safetyMetrics.biasCount}
                      hallucinationFlagRate={safetyMetrics.hallucinationFlagRate}
                      ethicalViolationCount={safetyMetrics.ethicalViolationCount}
                      trustworthinessScore={safetyMetrics.trustworthinessScore}
                    />
                  </Panel>
                </div>
              </div>

              {/* Right column */}
              <div className="w-72 shrink-0 border-l border-border/30 flex flex-col overflow-hidden">
                <Panel
                  title="Pattern Predictions"
                  icon={<TrendingUp size={12} />}
                  className="flex-1 rounded-none border-0 border-b border-border/30"
                >
                  <ScrollArea className="h-full">
                    <PatternPredictionsPanel
                      entries={transcriptEntries}
                      profile={predictionProfile}
                    />
                  </ScrollArea>
                </Panel>
                <Panel
                  title="Strategy Engine"
                  className="flex-1 rounded-none border-0"
                >
                  <ScrollArea className="h-full">
                    <div className="p-0">
                      {/* Inline strategy engine */}
                      <StrategySection
                        entries={transcriptEntries}
                        sessionId={activeSessionId}
                        usedStrategies={usedStrategies}
                        onMarkUsed={handleMarkStrategyUsed}
                      />
                    </div>
                  </ScrollArea>
                </Panel>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm px-6">
              <div className="w-16 h-16 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto mb-4">
                <Plus size={24} className="text-teal/50" />
              </div>
              <h2 className="text-sm font-mono font-semibold text-foreground/70 mb-2">
                No Active Session
              </h2>
              <p className="text-xs font-mono text-muted-foreground/50 mb-4">
                Create a new session to begin real-time transcript analysis and strategy generation.
              </p>
              <Button
                onClick={handleNewSession}
                disabled={newSessionDisabled}
                className="gap-2"
              >
                {actorFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : createSessionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {actorFetching
                  ? 'Connecting…'
                  : createSessionMutation.isPending
                  ? 'Creating…'
                  : 'New Session'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Strategy Section (inline) ─────────────────────────────────────────────────
import StrategyEnginePanel from '@/components/StrategyEnginePanel';

function StrategySection({
  entries,
  sessionId,
  usedStrategies,
  onMarkUsed,
}: {
  entries: ReturnType<typeof useDashboardState>['transcriptEntries'];
  sessionId: string | null;
  usedStrategies: Set<string>;
  onMarkUsed: (key: string) => void;
}) {
  return (
    <StrategyEnginePanel
      entries={entries}
      sessionId={sessionId}
      usedStrategies={usedStrategies}
      onMarkUsed={onMarkUsed}
    />
  );
}
