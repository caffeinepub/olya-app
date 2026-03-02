import React, { useState } from 'react';
import { toast } from 'sonner';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useDashboardState } from '../hooks/useDashboardState';
import {
  useGetSessions,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
} from '../hooks/useQueries';
import { useTranslation } from '../hooks/useTranslation';
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
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import type { ExtendedConversationSession } from '../backend';
import type { SpeakerRole } from '../hooks/useDashboardState';

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { t } = useTranslation();

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

  const { data: sessions = [], isLoading: sessionsLoading } = useGetSessions();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  void sessionsLoading; // SessionManager handles its own loading state

  const handleNewSession = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a new session.');
      return;
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await createSession.mutateAsync({
        sessionId,
        rawTranscript: '',
        transcriptEntries: [],
      });
      setActiveSessionId(sessionId);
      clearEntries();
      toast.success('New session created.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to create session:', err);
      if (message.includes('Unauthorized') || message.includes('Only users')) {
        toast.error('Please log in to create a new session.');
      } else {
        toast.error('Failed to create session. Please try again.');
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        clearEntries();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Failed to delete session. Please try again.');
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    if (sessionId !== activeSessionId) {
      setActiveSessionId(sessionId);
      clearEntries();
    }
  };

  const handleAddEntry = async (
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
  };

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
        {/* Sidebar — hidden on mobile, shown as flex-col on md+ */}
        <aside className="hidden md:flex md:flex-col w-64 border-r border-border bg-card shrink-0">
          <div className="p-3 border-b border-border">
            <Button
              className="w-full gap-2 text-sm"
              onClick={handleNewSession}
              disabled={createSession.isPending}
            >
              <Plus className="w-4 h-4" />
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
              isCreating={createSession.isPending}
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
                disabled={createSession.isPending}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
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
                  isCreating={createSession.isPending}
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
