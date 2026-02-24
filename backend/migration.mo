import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  // Old types
  type OldConversationSession = {
    sessionId : Text;
    timestamp : Time.Time;
    rawTranscript : Text;
    detectedEmotions : [OldEmotion];
    detectedIntents : [OldIntent];
    toxicityFlags : [OldToxicityFlag];
    beliefState : OldBeliefState;
    strategyRecommendations : [OldStrategyRecommendation];
  };

  type OldEmotion = {
    emotionType : Text;
    confidence : Float;
  };

  type OldIntent = {
    intentType : Text;
    confidence : Float;
  };

  type OldToxicityFlag = {
    flagType : Text;
    confidence : Float;
  };

  type OldBeliefState = {
    persuasionLevel : Float;
    trustLevel : Float;
    concerns : [Text];
  };

  type OldStrategyRecommendation = {
    strategy : Text;
    confidence : Float;
    rationale : Text;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    sessions : Map.Map<Text, OldConversationSession>;
  };

  // New types
  type NewConversationPattern = {
    speakerRole : Text;
    intent : Text;
    emotion : Text;
    topic : Text;
    occurrence : Nat;
  };

  type NewBiasCategory = {
    category : Text;
    count : Nat;
  };

  type NewEthicalViolation = {
    violationType : Text;
    count : Nat;
  };

  type NewConversationSession = {
    sessionId : Text;
    owner : Principal;
    timestamp : Time.Time;
    rawTranscript : Text;
    patterns : [NewConversationPattern];
    biasLog : [NewBiasCategory];
    ethicalViolations : [NewEthicalViolation];
  };

  type UserProfile = {
    name : Text;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    extendedSessions : Map.Map<Text, NewConversationSession>;
  };

  // Migration function
  public func run(old : OldActor) : NewActor {
    let newSessions = old.sessions.map<Text, OldConversationSession, NewConversationSession>(
      func(_id, oldSession) {
        {
          sessionId = oldSession.sessionId;
          // Sessions from before ownership tracking are assigned to the anonymous principal
          owner = Principal.anonymous();
          timestamp = oldSession.timestamp;
          rawTranscript = oldSession.rawTranscript;
          patterns = [];
          biasLog = [];
          ethicalViolations = [];
        };
      }
    );
    {
      userProfiles = old.userProfiles;
      extendedSessions = newSessions;
    };
  };
};

