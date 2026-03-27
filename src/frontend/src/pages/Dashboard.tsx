import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Printer } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { ExtendedConversationSession } from "../backend";
import AppHeader from "../components/AppHeader";
import BeliefStatePanel from "../components/BeliefStatePanel";
import EmotionIntentPanel from "../components/EmotionIntentPanel";
import PatternPredictionsPanel from "../components/PatternPredictionsPanel";
import PrintAnalysisView from "../components/PrintAnalysisView";
import SafetyQualityPanel from "../components/SafetyQualityPanel";
import SemanticAnalysisPanel from "../components/SemanticAnalysisPanel";
import SessionManager from "../components/SessionManager";
import SessionSummaryBar from "../components/SessionSummaryBar";
import StrategyEnginePanel from "../components/StrategyEnginePanel";
import TranscriptInput from "../components/TranscriptInput";
import TranscriptPanel from "../components/TranscriptPanel";
import { useDashboardState } from "../hooks/useDashboardState";
import type { SpeakerRole } from "../hooks/useDashboardState";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateEmptySession,
  useDeleteSession,
  useGetSessions,
  useUpdateSession,
} from "../hooks/useQueries";
import { useTranslation } from "../hooks/useTranslation";

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { t } = useTranslation();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [asrEngine, setAsrEngine] = useState<string>("webSpeech");

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
  const createEmptySession = useCreateEmptySession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  void sessionsLoading; // SessionManager handles its own loading state

  const handleNewSession = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to create a new session.");
      return;
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const newSession = await createEmptySession.mutateAsync(sessionId);
      setActiveSessionId(newSession.sessionId);
      clearEntries();
      toast.success("New session created.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Failed to create session:", err);
      if (message.includes("Unauthorized") || message.includes("Only users")) {
        toast.error("Please log in to create a new session.");
      } else {
        toast.error("Failed to create session. Please try again.");
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
      console.error("Failed to delete session:", err);
      toast.error("Failed to delete session. Please try again.");
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
    detectedLanguage?: string,
  ) => {
    const entry = await addTranscriptEntry(text, speaker, detectedLanguage);

    if (activeSessionId) {
      const allEntries = [...transcriptEntries, entry];
      const rawTranscript = allEntries.map((e) => e.text).join("\n");
      const backendEntries = allEntries.map((e) => ({
        text: e.text,
        detectedLanguage: e.detectedLanguage,
      }));
      const patterns = allEntries
        .filter((e) => e.intents.length > 0)
        .map((e) => ({
          speakerRole: e.speaker,
          intent: e.intents[0]?.intentType || "",
          emotion: e.emotions[0]?.emotionType || "",
          topic: "",
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
        console.error("Failed to update session:", err);
      }
    }
  };

  const isNlpActive = transcriptEntries.length > 0;
  const isEthicsActive = transcriptEntries.some(
    (e) => e.toxicityFlags.length > 0,
  );

  const canPrint = activeSessionId !== null && transcriptEntries.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="no-print">
        <AppHeader
          asrEngine={asrEngine}
          isNlpActive={isNlpActive}
          isEthicsActive={isEthicsActive}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="no-print hidden md:flex md:flex-col w-64 border-r border-border bg-card shrink-0">
          <div className="p-3 border-b border-border">
            <Button
              className="w-full gap-2 text-sm"
              onClick={handleNewSession}
              disabled={createEmptySession.isPending}
              data-ocid="session.primary_button"
            >
              {createEmptySession.isPending ? (
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {t("dashboard.newSession")}
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <SessionManager
              sessions={sessions as ExtendedConversationSession[]}
              activeSessionId={activeSessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
              isCreating={createEmptySession.isPending}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {!activeSessionId ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
              <div className="text-center space-y-3">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto" />
                <h2 className="text-xl font-semibold">
                  {t("dashboard.sessions")}
                </h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {t("dashboard.selectSession")}
                </p>
              </div>
              <Button
                onClick={handleNewSession}
                disabled={createEmptySession.isPending}
                className="gap-2"
                data-ocid="session.secondary_button"
              >
                {createEmptySession.isPending ? (
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {t("dashboard.newSession")}
              </Button>
              {/* Mobile session list */}
              <div className="w-full max-w-sm md:hidden">
                <SessionManager
                  sessions={sessions as ExtendedConversationSession[]}
                  activeSessionId={activeSessionId}
                  onSessionSelect={handleSessionSelect}
                  onNewSession={handleNewSession}
                  onDeleteSession={handleDeleteSession}
                  isCreating={createEmptySession.isPending}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4 max-w-7xl mx-auto">
              {/* Session Summary Bar + Print button */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <SessionSummaryBar
                    entries={transcriptEntries}
                    beliefState={beliefState}
                  />
                </div>
                {canPrint && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="no-print gap-1.5 shrink-0"
                    onClick={() => window.print()}
                    data-ocid="analysis.primary_button"
                  >
                    <Printer className="w-4 h-4" />
                    Print Analysis
                  </Button>
                )}
              </div>

              {/* Transcript Input */}
              <section className="no-print rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("dashboard.transcriptTitle")}
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
              <div className="no-print grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("dashboard.emotionIntentTitle")}
                  </h3>
                  <EmotionIntentPanel
                    latestEntry={latestEntry}
                    entries={transcriptEntries}
                  />
                </section>

                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("dashboard.beliefStateTitle")}
                  </h3>
                  <BeliefStatePanel
                    beliefState={beliefState}
                    entries={transcriptEntries}
                  />
                </section>

                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("dashboard.semanticTitle")}
                  </h3>
                  <SemanticAnalysisPanel entries={transcriptEntries} />
                </section>

                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("dashboard.patternTitle")}
                  </h3>
                  <PatternPredictionsPanel entries={transcriptEntries} />
                </section>

                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("dashboard.safetyTitle")}
                  </h3>
                  <SafetyQualityPanel entries={transcriptEntries} />
                </section>

                <section className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("dashboard.strategyTitle")}
                  </h3>
                  <StrategyEnginePanel
                    latestEntry={latestEntry}
                    entries={transcriptEntries}
                  />
                </section>
              </div>

              {/* Print-only analysis report */}
              <PrintAnalysisView
                sessionId={activeSessionId}
                entries={transcriptEntries}
                beliefState={beliefState}
                latestEntry={latestEntry}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
