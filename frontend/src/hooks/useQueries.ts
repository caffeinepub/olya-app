import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ExtendedConversationSession, ConversationPattern, BiasCategory, EthicalViolation, UserProfile, backendInterface } from '../backend';

// Helper to get actor from query cache at mutation time (avoids stale closure)
function getActorFromCache(queryClient: ReturnType<typeof useQueryClient>): backendInterface | null {
  const cache = queryClient.getQueriesData<backendInterface>({ queryKey: ['actor'] });
  for (const [, data] of cache) {
    if (data) return data;
  }
  return null;
}

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
      const currentActor = actor || getActorFromCache(queryClient);
      if (!currentActor) throw new Error('Actor not available');
      return currentActor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function useGetSessionsByTimestamp() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ExtendedConversationSession[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSessionsByTimestamp();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30000,
  });
}

export function useGetSession(sessionId: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ExtendedConversationSession>({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) throw new Error('Actor or sessionId not available');
      return actor.getSession(sessionId);
    },
    enabled: !!actor && !actorFetching && !!sessionId,
  });
}

export function useCreateSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, rawTranscript }: { sessionId: string; rawTranscript: string }) => {
      const currentActor = actor || getActorFromCache(queryClient);
      if (!currentActor) throw new Error('Actor not available. Please wait for the connection to initialize.');
      const session = await currentActor.createSession(sessionId, rawTranscript);
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: Error) => {
      console.error('createSession error:', error.message);
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
      patterns,
    }: {
      sessionId: string;
      rawTranscript: string;
      patterns: ConversationPattern[];
    }) => {
      const currentActor = actor || getActorFromCache(queryClient);
      if (!currentActor) throw new Error('Actor not available');
      return currentActor.updateSession(sessionId, rawTranscript, patterns);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['patternProfile'] });
    },
  });
}

export function useDeleteSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const currentActor = actor || getActorFromCache(queryClient);
      if (!currentActor) throw new Error('Actor not available');
      return currentActor.deleteSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['patternProfile'] });
    },
  });
}

export function useAddStrategyRecommendation() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      sessionId,
      recommendation,
    }: {
      sessionId: string;
      recommendation: { strategy: string; confidence: number; rationale: string };
    }) => {
      const currentActor = actor || getActorFromCache(queryClient);
      if (!currentActor) throw new Error('Actor not available');
      // Update session with the strategy as a pattern
      const pattern: ConversationPattern = {
        speakerRole: 'Operator',
        intent: recommendation.strategy,
        emotion: 'neutral',
        topic: recommendation.rationale.slice(0, 50),
        occurrence: 1n,
      };
      return currentActor.updateSession(sessionId, '', [pattern]);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// ─── Pattern Profile ──────────────────────────────────────────────────────────

export interface AggregateData {
  patterns: ConversationPattern[];
  biases: BiasCategory[];
  ethicalViolations: EthicalViolation[];
}

export function useGetPatternProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AggregateData>({
    queryKey: ['patternProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAggregateData();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 60_000,
  });
}
