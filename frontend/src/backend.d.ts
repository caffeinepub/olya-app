import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ExtendedConversationSession {
    biasLog: Array<BiasCategory>;
    patterns: Array<ConversationPattern>;
    owner: Principal;
    transcriptEntries: Array<TranscriptEntry>;
    timestamp: Time;
    rawTranscript: string;
    sessionId: string;
    ethicalViolations: Array<EthicalViolation>;
}
export type Time = bigint;
export interface TranscriptEntry {
    text: string;
    detectedLanguage: string;
}
export interface EthicalViolation {
    count: bigint;
    violationType: string;
}
export interface ConversationPattern {
    topic: string;
    emotion: string;
    speakerRole: string;
    occurrence: bigint;
    intent: string;
}
export interface BiasCategory {
    count: bigint;
    category: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create session with ethics checks (users only)
     */
    createSession(sessionId: string, rawTranscript: string, transcriptEntries: Array<TranscriptEntry>): Promise<ExtendedConversationSession>;
    /**
     * / Delete session (owner only)
     */
    deleteSession(sessionId: string): Promise<void>;
    /**
     * / Get aggregate data for the caller's sessions (admins see all)
     */
    getAggregateData(): Promise<{
        patterns: Array<ConversationPattern>;
        ethicalViolations: Array<EthicalViolation>;
        biases: Array<BiasCategory>;
    }>;
    /**
     * / Admin-only: get all bias logs across all sessions for operator review
     */
    getAllBiasLogs(): Promise<Array<[string, Array<BiasCategory>]>>;
    /**
     * / Admin-only: get all ethical violation logs across all sessions for operator review
     */
    getAllEthicalViolationLogs(): Promise<Array<[string, Array<EthicalViolation>]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get a specific session by ID (owner or admin only)
     */
    getSession(sessionId: string): Promise<ExtendedConversationSession>;
    /**
     * / Get all sessions belonging to the caller (admins see all sessions)
     */
    getSessionsByTimestamp(): Promise<Array<ExtendedConversationSession>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Update session transcript and patterns (owner only)
     */
    updateSession(sessionId: string, rawTranscript: string, transcriptEntries: Array<TranscriptEntry>, patterns: Array<ConversationPattern>): Promise<void>;
}
