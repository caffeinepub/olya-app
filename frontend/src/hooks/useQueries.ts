import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import {
  ExtendedConversationSession,
  TranscriptEntry,
  ConversationPattern,
  UserProfile,
  UserRole,
} from '../backend';

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
 * assignCallerUserRole is idempotent — calling it multiple times is safe.
 */
export function useEnsureUserRole() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      const principal = identity.getPrincipal();
      await actor.assignCallerUserRole(principal as never, UserRole.user);
    },
    // Silently ignore errors — the user may already have a role or be admin
    onError: () => {},
  });
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export function useGetSessions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ExtendedConversationSession[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSessionsByTimestamp();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateSession() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isReady = !!actor && !actorFetching && !!identity;

  const mutation = useMutation({
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
      if (!identity) throw new Error('Not authenticated');

      // Ensure the caller has the #user role (idempotent)
      try {
        const principal = identity.getPrincipal();
        await actor.assignCallerUserRole(principal as never, UserRole.user);
      } catch {
        // Role may already be assigned or caller is admin — proceed anyway
      }

      return actor.createSession(sessionId, rawTranscript, transcriptEntries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  return { ...mutation, isReady };
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
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

export function useAddStrategyRecommendation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      strategy,
    }: {
      sessionId: string;
      strategy: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Fetch current session and append the strategy as a ConversationPattern
      const session = await actor.getSession(sessionId);
      const newPattern: ConversationPattern = {
        speakerRole: 'Unknown',
        intent: strategy,
        emotion: 'neutral',
        topic: 'strategy',
        occurrence: BigInt(1),
      };
      const updatedPatterns = [...session.patterns, newPattern];
      return actor.updateSession(
        sessionId,
        session.rawTranscript,
        session.transcriptEntries,
        updatedPatterns
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
