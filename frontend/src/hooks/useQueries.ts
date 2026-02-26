import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  ExtendedConversationSession,
  TranscriptEntry,
  ConversationPattern,
  UserProfile,
} from '../backend';
import { UserRole } from '../backend';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
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
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
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
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
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
    queryKey: ['sessions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSessionsByTimestamp();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSession() {
  const { actor } = useActor();
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
      if (!actor) throw new Error('Actor not available');
      return actor.createSession(sessionId, rawTranscript, transcriptEntries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
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
      if (!actor) throw new Error('Actor not available');
      return actor.updateSession(sessionId, rawTranscript, transcriptEntries, patterns);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] });
    },
  });
}

export function useDeleteSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useGetAggregateData() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['aggregateData'],
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
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
