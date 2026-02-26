import React, { useState, useCallback } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useGetSessions, useCreateSession, useDeleteSession, useUpdateSession } from '../hooks/useQueries';
import AppHeader from '../components/AppHeader';
import SessionManager from '../components/SessionManager';
import TranscriptInput from '../components/TranscriptInput';
import TranscriptPanel from '../components/TranscriptPanel';
import EmotionIntentPanel from '../components/EmotionIntentPanel';
import BeliefStatePanel from '../components/BeliefStatePanel';
import SemanticAnalysisPanel from '../components/SemanticAnalysisPanel';
import PatternPredictionsPanel from '../components/PatternPredictionsPanel';
import SafetyQualityPanel from '../components/SafetyQualityPanel';
import StrategyEnginePanel from '../components/StrategyEnginePanel';
import SessionSummaryBar from '../components/SessionSummaryBar';
import { useDashboardState } from '../hooks/useDashboardState';
import type { SpeakerRole } from '../hooks/useDashboardState';
import { ExtendedConversationSession } from '../backend';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { isFetching: actorFetching } = useActor();
  const { t } = useTranslation();

  const { data: sessions = [] } = useGetSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const updateSession = useUpdateSession();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [asrEngine, setAsrEngine] = useState<string>('webSpeech');

  const {
    transcriptEntries,
    beliefState,
    latestEntry,
    addTranscriptEntry,
    toggleTranslation,
    translateEntry,
    clearEntries,
  } = useDashboardState();

  // Button is busy when the mutation is running or the actor is still initializing
  const isCreatingSession = createSession.isPending || actorFetching;

  const handleNewSession = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a new session.');
      return;
    }

    if (actorFetching) {
      toast.info('Still initializing, please try again in a moment.');
      return;
    }

    if (!createSession.isReady) {
      toast.error('Not ready. Please ensure you are logged in and try again.');
      return;
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const created = await createSession.mutateAsync({
        sessionId,
        rawTranscript: '',
        transcriptEntries: [],
      });
      const newId = created?.sessionId ?? sessionId;
      setActiveSessionId(newId);
      clearEntries();
      toast.success('New session created.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to create session:', err);
      if (message.includes('Unauthorized') || message.includes('Only users')) {
        toast.error('Please log in to create a new session.');
      } else if (message.includes('Actor not available')) {
        toast.error('Still initializing. Please try again in a moment.');
      } else {
        toast.error('Failed to create session. Please try again.');
      }
    }
  }, [isAuthenticated, actorFetching, createSession, clearEntries]);

  const handleSessionSelect = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    clearEntries();
  }, [clearEntries]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        clearEntries();
      }
      toast.success('Session deleted.');
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Failed to delete session. Please try again.');
    }
  }, [deleteSession, activeSessionId, clearEntries]);

  const handleAddEntry = useCallback(async (
    text: string,
    speaker: SpeakerRole,
    detectedLanguage?: string
  ) => {
    const entry = addTranscriptEntry(text, speaker, detectedLanguage);

    if (activeSessionId) {
      const allEntries = [...transcriptEntries, entry];
      const rawTranscript = allEntries.map((e) => e.text).join('\n');
      const backendEntries = allEntries.map((e) => ({
        text: e.text,
        detectedLanguage: e.detectedLanguage,
      }));
      const patterns = allEntries
        .filter((e) => e.intents.length > 0)
        .map((e) => ({
          speakerRole: e.speaker,
          intent: e.intents[0]?.intentType || '',
          emotion: e.emotions[0]?.emotionType || '',
          topic: '',
          occurrence: BigInt(1),
        }));

      try {
        await updateSession.mutateAsync({
          sessionId: activeSessionId,
          rawTranscript,
          transcriptEntries: backendEntries,
          patterns,
        });
      } catch (err) {
        console.error('Failed to update session:', err);
      }
    }
  }, [addTranscriptEntry, activeSessionId, transcriptEntries, updateSession]);

  const isNlpActive = transcriptEntries.length > 0;
  const isEthicsActive = transcriptEntries.some((e) => e.toxicityFlags.length > 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        asrEngine={asrEngine}
        isNlpActive={isNlpActive}
        isEthicsActive={isEthicsActive}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex md:flex-col w-64 border-r border-border bg-card shrink-0">
          <div className="p-3 border-b border-border">
            <Button
              className="w-full gap-2 text-sm"
              onClick={handleNewSession}
              disabled={isCreatingSession}
            >
              {isCreatingSession ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {t('dashboard.newSession')}
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <SessionManager
              sessions={sessions as ExtendedConversationSession[]}
              activeSessionId={activeSessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
              isCreating={isCreatingSession}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {!activeSessionId ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
              <div className="text-center space-y-3">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto" />
                <h2 className="text-xl font-semibold">{t('dashboard.sessions')}</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {t('dashboard.selectSession')}
                </p>
              </div>
              <Button
                onClick={handleNewSession}
                disabled={isCreatingSession}
                className="gap-2"
              >
                {isCreatingSession ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {t('dashboard.newSession')}
              </Button>
              {/* Mobile session list */}
              <div className="w-full max-w-sm md:hidden">
                <SessionManager
                  sessions={sessions as ExtendedConversationSession[]}
                  activeSessionId={activeSessionId}
                  onSessionSelect={handleSessionSelect}
                  onNewSession={handleNewSession}
                  onDeleteSession={handleDeleteSession}
                  isCreating={isCreatingSession}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4 max-w-7xl mx-auto">
              {/* Session Summary Bar */}
              <SessionSummaryBar
                entries={transcriptEntries}
                beliefState={beliefState}
              />

              {/* Transcript Input */}
              <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('dashboard.transcriptTitle')}
                </h3>
                <TranscriptInput
                  onAddEntry={handleAddEntry}
                  onAsrEngineChange={setAsrEngine}
                  disabled={false}
                />
                <TranscriptPanel
                  entries={transcriptEntries}
                  onToggleTranslation={toggleTranslation}
                  onTranslateEntry={translateEntry}
                />
              </section>

              {/* Analysis panels grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('dashboard.emotionIntentTitle')}
                  </h3>
                  <EmotionIntentPanel
                    latestEntry={latestEntry}
                    entries={transcriptEntries}
                  />
                </section>

                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('dashboard.beliefStateTitle')}
                  </h3>
                  <BeliefStatePanel
                    beliefState={beliefState}
                    entries={transcriptEntries}
                  />
                </section>

                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('dashboard.semanticTitle')}
                  </h3>
                  <SemanticAnalysisPanel entries={transcriptEntries} />
                </section>

                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('dashboard.patternTitle')}
                  </h3>
                  <PatternPredictionsPanel entries={transcriptEntries} />
                </section>

                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('dashboard.safetyTitle')}
                  </h3>
                  <SafetyQualityPanel entries={transcriptEntries} />
                </section>

                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('dashboard.strategyTitle')}
                  </h3>
                  <StrategyEnginePanel
                    latestEntry={latestEntry}
                    entries={transcriptEntries}
                  />
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
