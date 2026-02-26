import React, { useState } from 'react';
import { Plus, Trash2, MessageSquare, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ExtendedConversationSession } from '../backend';

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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSessionPreview(session: ExtendedConversationSession): string {
  if (session.rawTranscript && session.rawTranscript.trim().length > 0) {
    return session.rawTranscript.slice(0, 60) + (session.rawTranscript.length > 60 ? '…' : '');
  }
  return 'Empty session';
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
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No sessions yet</p>
              <p className="text-xs opacity-60 mt-1">Click + to start</p>
            </div>
          )}
          {sessions.map((session) => {
            const isActive = session.sessionId === activeSessionId;
            const isDeleting = deletingId === session.sessionId;
            return (
              <div
                key={session.sessionId}
                onClick={() => onSessionSelect(session.sessionId)}
                className={`group rounded-lg p-2.5 cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/15 border border-primary/30'
                    : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                {/* Top row: icon + title + delete button */}
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare
                    className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-xs font-medium truncate flex-1 min-w-0 ${isActive ? 'text-primary' : 'text-foreground'}`}
                  >
                    Session {session.sessionId.slice(-6)}
                  </span>
                  {/* Delete button — always visible, right side of title row */}
                  <button
                    onClick={(e) => handleDelete(e, session.sessionId)}
                    disabled={isDeleting}
                    className="flex-shrink-0 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Delete session"
                    aria-label="Delete session"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Preview text */}
                <p className="text-xs text-muted-foreground truncate leading-relaxed pl-4">
                  {getSessionPreview(session)}
                </p>

                {/* Bottom row: timestamp + badges */}
                <div className="flex items-center justify-between mt-1.5 pl-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatTimestamp(session.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {session.patterns.length > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                        {session.patterns.length}p
                      </Badge>
                    )}
                    {session.ethicalViolations.length > 0 && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                        {session.ethicalViolations.length}v
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
