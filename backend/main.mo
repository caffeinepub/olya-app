import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import List "mo:core/List";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Conversation system types

  public type ConversationPattern = {
    speakerRole : Text;
    intent : Text;
    emotion : Text;
    topic : Text;
    occurrence : Nat;
  };

  public type BiasCategory = {
    category : Text;
    count : Nat;
  };

  public type EthicalViolation = {
    violationType : Text;
    count : Nat;
  };

  public type ExtendedConversationSession = {
    sessionId : Text;
    owner : Principal;
    timestamp : Time.Time;
    rawTranscript : Text;
    patterns : [ConversationPattern];
    biasLog : [BiasCategory];
    ethicalViolations : [EthicalViolation];
  };

  module ExtendedConversationSession {
    public func compare(a : ExtendedConversationSession, b : ExtendedConversationSession) : Order.Order {
      if (a.timestamp < b.timestamp) { return #greater };
      if (a.timestamp > b.timestamp) { return #less };
      #equal;
    };
  };

  let extendedSessions = Map.empty<Text, ExtendedConversationSession>();

  // Helper: check if caller owns the session or is admin
  func requireSessionAccess(caller : Principal, sessionId : Text) : ExtendedConversationSession {
    switch (extendedSessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?session) {
        if (session.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You do not have access to this session");
        };
        session;
      };
    };
  };

  // Session management

  /// Get all sessions belonging to the caller (admins see all sessions)
  public query ({ caller }) func getSessionsByTimestamp() : async [ExtendedConversationSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user)) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only users or admins can view sessions");
    };
    let isAdminCaller = AccessControl.isAdmin(accessControlState, caller);
    let filtered = extendedSessions.values().filter(
      func(session) {
        isAdminCaller or session.owner == caller;
      }
    );
    filtered.toArray().sort();
  };

  /// Get a specific session by ID (owner or admin only)
  public query ({ caller }) func getSession(sessionId : Text) : async ExtendedConversationSession {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user)) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only users or admins can view sessions");
    };
    requireSessionAccess(caller, sessionId);
  };

  /// Create session with ethics checks (users only)
  public shared ({ caller }) func createSession(sessionId : Text, rawTranscript : Text) : async ExtendedConversationSession {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create sessions");
    };

    if (extendedSessions.containsKey(sessionId)) {
      Runtime.trap("Session already exists with this ID");
    };

    let session : ExtendedConversationSession = {
      sessionId;
      owner = caller;
      timestamp = Time.now();
      rawTranscript;
      patterns = [];
      biasLog = [];
      ethicalViolations = [];
    };

    extendedSessions.add(sessionId, session);
    session;
  };

  /// Update session transcript and patterns (owner only)
  public shared ({ caller }) func updateSession(sessionId : Text, rawTranscript : Text, patterns : [ConversationPattern]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update sessions");
    };

    let existing = requireSessionAccess(caller, sessionId);

    let biasLog = detectBiases(rawTranscript);
    let ethicalViolations = enforceEthicalConstraints(rawTranscript);

    let updatedSession : ExtendedConversationSession = {
      sessionId;
      owner = existing.owner;
      timestamp = Time.now();
      rawTranscript;
      patterns;
      biasLog = biasLog.toArray();
      ethicalViolations = ethicalViolations.toArray();
    };

    extendedSessions.add(sessionId, updatedSession);
  };

  /// Delete session (owner only)
  public shared ({ caller }) func deleteSession(sessionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete sessions");
    };
    let _ = requireSessionAccess(caller, sessionId);
    extendedSessions.remove(sessionId);
  };

  /// Get aggregate data for the caller's sessions (admins see all)
  public query ({ caller }) func getAggregateData() : async {
    patterns : [ConversationPattern];
    biases : [BiasCategory];
    ethicalViolations : [EthicalViolation];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user)) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only users or admins can view aggregate data");
    };
    let isAdminCaller = AccessControl.isAdmin(accessControlState, caller);

    var patterns = List.empty<ConversationPattern>();
    var biases = List.empty<BiasCategory>();
    var ethicalViolations = List.empty<EthicalViolation>();

    for (session in extendedSessions.values()) {
      if (isAdminCaller or session.owner == caller) {
        patterns.addAll(session.patterns.values());
        biases.addAll(session.biasLog.values());
        ethicalViolations.addAll(session.ethicalViolations.values());
      };
    };

    {
      patterns = patterns.toArray();
      biases = biases.toArray();
      ethicalViolations = ethicalViolations.toArray();
    };
  };

  /// Admin-only: get all bias logs across all sessions for operator review
  public query ({ caller }) func getAllBiasLogs() : async [(Text, [BiasCategory])] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can review all bias logs");
    };
    extendedSessions.entries().map(
      func(entry) {
        let (sessionId, session) = entry;
        (sessionId, session.biasLog);
      }
    ).toArray();
  };

  /// Admin-only: get all ethical violation logs across all sessions for operator review
  public query ({ caller }) func getAllEthicalViolationLogs() : async [(Text, [EthicalViolation])] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can review all ethical violation logs");
    };
    extendedSessions.entries().map(
      func(entry) {
        let (sessionId, session) = entry;
        (sessionId, session.ethicalViolations);
      }
    ).toArray();
  };

  /// Bias detection logic
  func detectBiases(text : Text) : List.List<BiasCategory> {
    let biases = List.empty<BiasCategory>();

    let genderBiases = [
      "he", "she", "man", "woman", "male", "female", "boys", "girls", "gender", "sexist", "misogynist",
    ];
    let racialBiases = [
      "race", "ethnicity", "skin color", "racial", "minority", "discrimination", "racism",
    ];
    let socioeconomicBiases = [
      "wealth", "poverty", "income", "rich", "poor", "class", "economic",
    ];
    let cognitiveBiases = [
      "confirmation bias", "stereotype", "prejudice", "assumption", "implicit bias",
    ];

    func addBiasIfFound(biasesArray : [Text], category : Text) {
      var count = 0;
      for (bias in biasesArray.values()) {
        if (containsIgnoreCase(text, bias)) {
          count += 1;
        };
      };
      if (count > 0) {
        biases.add({ category; count });
      };
    };

    addBiasIfFound(genderBiases, "gender");
    addBiasIfFound(racialBiases, "race");
    addBiasIfFound(socioeconomicBiases, "socioeconomic");
    addBiasIfFound(cognitiveBiases, "cognitive");

    biases;
  };

  /// Ethical constraints enforcement logic
  func enforceEthicalConstraints(text : Text) : List.List<EthicalViolation> {
    let violations = List.empty<EthicalViolation>();

    let hardEthicalRules : [(Text, [Text])] = [
      ("personal attack", ["insult", "demean", "berate", "attack"]),
      (
        "manipulative framing",
        [
          "distort",
          "manipulate",
          "misrepresent",
          "spin",
          "frame with bias",
        ],
      ),
      (
        "dehumanizing language",
        [
          "subhuman",
          "less than human",
          "objectify",
          "demean groups",
        ],
      ),
      (
        "coercive pressure tactics",
        [
          "threaten",
          "force",
          "coerce",
          "manipulate into action",
          "pressure tactics",
        ],
      ),
    ];

    for (rule in hardEthicalRules.values()) {
      let (violationType, patterns) = rule;
      var count = 0;

      for (pattern in patterns.values()) {
        if (containsIgnoreCase(text, pattern)) {
          count += 1;
        };
      };

      if (count > 0) {
        violations.add({ violationType; count });
      };
    };

    violations;
  };

  /// Helper functions
  func containsIgnoreCase(text : Text, sub : Text) : Bool {
    let lowerText = toLowerCase(text);
    let lowerSub = toLowerCase(sub);
    lowerText.contains(#text lowerSub);
  };

  func toLowerCase(text : Text) : Text {
    text.map(func(c) { if (isUpperCase(c)) { toLowerChar(c) } else { c } });
  };

  func isUpperCase(c : Char) : Bool {
    switch (c) {
      case (_) { c >= 'A' and c <= 'Z' };
    };
  };

  func toLowerChar(c : Char) : Char {
    let offset : Nat32 = c.toNat32() - 'A'.toNat32();
    Char.fromNat32('a'.toNat32() + offset);
  };
};

