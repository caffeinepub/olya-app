import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { ExtendedConversationSession } from "../backend";

interface SessionManagerProps {
  sessions: ExtendedConversationSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  isCreating?: boolean;
}

function formatTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSessionPreview(session: ExtendedConversationSession): string {
  if (session.rawTranscript && session.rawTranscript.trim().length > 0) {
    return (
      session.rawTranscript.slice(0, 60) +
      (session.rawTranscript.length > 60 ? "\u2026" : "")
    );
  }
  return "Empty session";
}

export default function SessionManager({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  isCreating = false,
}: SessionManagerProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingId(sessionId);
    try {
      await onDeleteSession(sessionId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Sessions
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={onNewSession}
          disabled={isCreating}
          title="New Session"
          data-ocid="session.primary_button"
        >
          {isCreating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Session List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 && (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="session.empty_state"
            >
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No sessions yet</p>
              <p className="text-xs opacity-60 mt-1">Click + to start</p>
            </div>
          )}
          {sessions.map((session, index) => {
            const isActive = session.sessionId === activeSessionId;
            const isDeleting = deletingId === session.sessionId;
            return (
              <div
                key={session.sessionId}
                className="flex items-stretch group"
                data-ocid={`session.item.${index + 1}`}
              >
                {/* Main session select button */}
                <button
                  type="button"
                  onClick={() => onSessionSelect(session.sessionId)}
                  className={`flex-1 min-w-0 text-left rounded-l-lg p-2.5 cursor-pointer transition-all duration-150 ${
                    isActive
                      ? "bg-primary/15 border border-primary/30 border-r-0"
                      : "hover:bg-muted/50 border border-transparent hover:border-border/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare
                          className={`h-3 w-3 flex-shrink-0 ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium truncate ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                        >
                          Session {session.sessionId.slice(-6)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate leading-relaxed">
                        {getSessionPreview(session)}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatTimestamp(session.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {session.patterns.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0 h-4"
                        >
                          {session.patterns.length}p
                        </Badge>
                      )}
                      {session.ethicalViolations.length > 0 && (
                        <Badge
                          variant="destructive"
                          className="text-[9px] px-1 py-0 h-4"
                        >
                          {session.ethicalViolations.length}v
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>

                {/* Delete button — always visible, high-contrast red */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, session.sessionId)}
                  disabled={isDeleting}
                  className={`flex items-center justify-center w-9 shrink-0 rounded-r-lg transition-colors touch-manipulation border ${
                    isActive
                      ? "bg-destructive/20 border-primary/30 border-l-0 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                      : "bg-destructive/10 border-border border-l-0 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                  }`}
                  title="Delete session"
                  aria-label="Delete session"
                  data-ocid={`session.delete_button.${index + 1}`}
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
