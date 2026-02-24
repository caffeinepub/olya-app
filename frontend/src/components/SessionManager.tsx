import React, { useState } from 'react';
import { Plus, BarChart2, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetSessionsByTimestamp, useDeleteSession } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import type { ExtendedConversationSession } from '../backend';
import { cn } from '@/lib/utils';

interface SessionManagerProps {
  currentSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  isCreating?: boolean;
}

function formatTimeAgo(timestamp: bigint): string {
  const nowNs = BigInt(Date.now()) * BigInt(1_000_000);
  const diffMs = Number((nowNs - timestamp) / BigInt(1_000_000));
  if (diffMs < 0) return 'just now';
  if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`;
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return `${Math.floor(diffMs / 86400000)}d ago`;
}

function getSessionHealthColor(session: ExtendedConversationSession): string {
  const hasEthicalViolations = session.ethicalViolations.length > 0;
  if (hasEthicalViolations) return 'text-red-400';
  if (session.patterns.length >= 3) return 'text-teal';
  return 'text-amber';
}

function getSessionHealthLabel(session: ExtendedConversationSession): string {
  const hasEthicalViolations = session.ethicalViolations.length > 0;
  if (hasEthicalViolations) return 'Critical';
  if (session.patterns.length >= 3) return 'Active';
  return 'Pending';
}

export default function SessionManager({
  currentSessionId,
  onNewSession,
  onSelectSession,
  isCreating = false,
}: SessionManagerProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const actorReady = !!actor && !actorFetching;
  const { data: sessions, isLoading } = useGetSessionsByTimestamp();
  const deleteSession = useDeleteSession();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      await deleteSession.mutateAsync(sessionId);
    } finally {
      setDeletingId(null);
    }
  };

  const buttonDisabled = !actorReady || isCreating;

  return (
    <div className="flex flex-col h-full panel-base">
      <div className="panel-header justify-between">
        <span className="panel-label">Sessions</span>
        <Button
          size="sm"
          onClick={onNewSession}
          disabled={buttonDisabled}
          className="h-6 text-[10px] font-mono bg-teal/10 hover:bg-teal/20 border border-teal/30 text-teal px-2 disabled:opacity-40"
          variant="ghost"
        >
          {actorFetching || isCreating ? (
            <Loader2 size={10} className="mr-1 animate-spin" />
          ) : (
            <Plus size={10} className="mr-1" />
          )}
          {isCreating ? 'Creating...' : 'New'}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground/40">
            <BarChart2 size={20} className="mx-auto mb-2 opacity-30" />
            <p className="text-[10px] font-mono">No sessions yet</p>
            <p className="text-[9px] font-mono mt-1 opacity-60">Start a new session to begin</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map(session => (
              <button
                key={session.sessionId}
                onClick={() => onSelectSession(session.sessionId)}
                className={cn(
                  'w-full text-left p-2 rounded border transition-all group relative',
                  currentSessionId === session.sessionId
                    ? 'bg-teal/10 border-teal/30'
                    : 'bg-navy/30 border-border/40 hover:border-teal/20 hover:bg-navy/50'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-foreground/80 truncate flex-1 pr-2">
                    Session {session.sessionId.slice(-8).toUpperCase()}
                  </span>
                  <button
                    onClick={e => handleDelete(e, session.sessionId)}
                    disabled={deletingId === session.sessionId}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-950/50 text-muted-foreground/40 hover:text-red-400"
                    title="Delete session"
                  >
                    {deletingId === session.sessionId ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Trash2 size={10} />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-muted-foreground/50">
                    {formatTimeAgo(session.timestamp)}
                  </span>
                  <span className={cn('text-[9px] font-mono', getSessionHealthColor(session))}>
                    {getSessionHealthLabel(session)}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/40 ml-auto">
                    {session.patterns.length} patterns
                  </span>
                </div>
                {currentSessionId === session.sessionId && (
                  <ChevronRight size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-teal/50" />
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
