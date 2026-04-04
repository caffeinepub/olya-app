import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ConversationPattern,
  ExtendedConversationSession,
  TranscriptEntry,
  UserProfile,
} from "../backend";
import { UserRole } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Role Initialization ─────────────────────────────────────────────────────

/**
 * Ensures the authenticated caller has the #user role assigned.
 * Must be called after login so that backend operations (createSession, etc.)
 * succeed. assignCallerUserRole is idempotent — calling it multiple times is safe.
 */
export function useEnsureUserRole() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      if (!identity) throw new Error("Not authenticated");
      const principal = identity.getPrincipal();
      await actor.assignCallerUserRole(principal, UserRole.user);
    },
    // Silently ignore errors — the user may already have a role or be admin
    onError: () => {},
  });
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export function useGetSessions() {
  const { actor, isFetching } = useActor();

  return useQuery<ExtendedConversationSession[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSessionsByTimestamp();
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Creates a new empty session using the dedicated createEmptySession backend method.
 * This is the preferred way to create a new session from the UI "New Session" button.
 */
export function useCreateEmptySession() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error("Actor not available");
      if (!identity) throw new Error("Not authenticated");

      // Ensure the caller has the #user role before attempting to create a session.
      // assignCallerUserRole is idempotent — safe to call every time.
      try {
        const principal = identity.getPrincipal();
        await actor.assignCallerUserRole(principal, UserRole.user);
      } catch {
        // Role may already be assigned or caller is admin — proceed anyway
      }

      return actor.createEmptySession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useCreateSession() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      rawTranscript,
      transcriptEntries,
    }: {
      sessionId: string;
      rawTranscript: string;
      transcriptEntries: TranscriptEntry[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (!identity) throw new Error("Not authenticated");

      // Ensure the caller has the #user role before attempting to create a session.
      // assignCallerUserRole is idempotent — safe to call every time.
      try {
        const principal = identity.getPrincipal();
        await actor.assignCallerUserRole(principal, UserRole.user);
      } catch {
        // Role may already be assigned or caller is admin — proceed anyway
      }

      return actor.createSession(sessionId, rawTranscript, transcriptEntries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useUpdateSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      rawTranscript,
      transcriptEntries,
      patterns,
    }: {
      sessionId: string;
      rawTranscript: string;
      transcriptEntries: TranscriptEntry[];
      patterns: ConversationPattern[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateSession(
        sessionId,
        rawTranscript,
        transcriptEntries,
        patterns,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["session", variables.sessionId],
      });
    },
  });
}

/** Returns true if the error message indicates the session no longer exists on the backend. */
function isNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.toLowerCase().includes("not found") ||
    msg.toLowerCase().includes("notfound") ||
    msg.toLowerCase().includes("does not exist") ||
    msg.toLowerCase().includes("no session") ||
    msg.toLowerCase().includes("session not")
  );
}

export function useDeleteSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteSession(sessionId);
    },

    onMutate: async (sessionId: string) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["sessions"] });

      // Snapshot current list for potential rollback
      const previousSessions = queryClient.getQueryData<
        ExtendedConversationSession[]
      >(["sessions"]);

      // Optimistically remove the session from the cache immediately
      queryClient.setQueryData<ExtendedConversationSession[]>(
        ["sessions"],
        (old) => (old ? old.filter((s) => s.sessionId !== sessionId) : []),
      );

      return { previousSessions };
    },

    onError: (err, _sessionId, context) => {
      // If the session wasn't found on the backend, it's already gone — keep it removed
      if (isNotFoundError(err)) return;

      // For other errors, roll back to the previous list
      if (context?.previousSessions !== undefined) {
        queryClient.setQueryData(["sessions"], context.previousSessions);
      }
    },

    onSettled: () => {
      // Always sync with the backend after the mutation completes
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useGetAggregateData() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["aggregateData"],
    queryFn: async () => {
      if (!actor) return { patterns: [], biases: [], ethicalViolations: [] };
      return actor.getAggregateData();
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Strategy recommendations are stored client-side only.
 * The mutation accepts a plain strategy string (as produced by the strategy simulator)
 * and resolves immediately without a backend call.
 */
export function useAddStrategyRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_data: { sessionId: string; strategy: string }) => {
      // Strategy recommendations are managed client-side in dashboard state
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
