import React, { useRef } from 'react';
import { Printer, ArrowLeft, BookOpen, LogIn, User, Globe, FolderOpen, Mic, Brain, BarChart2, Shield, Zap, Activity, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ id, icon, title, subtitle, children }: SectionProps) {
  return (
    <section id={id} className="mb-12 print:mb-8 print:break-inside-avoid-page">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded flex items-center justify-center bg-teal/10 border border-teal/30 text-teal print:bg-transparent print:border-teal/50">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs font-mono text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="pl-11">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 print:mb-4">
      <h3 className="text-sm font-semibold text-teal mb-2 font-mono uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-1.5 ml-1">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal/15 border border-teal/30 text-teal text-[10px] font-mono font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <span className="leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function InfoBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warning' | 'tip' }) {
  const styles = {
    info: 'bg-teal/5 border-teal/20 text-foreground/80',
    warning: 'bg-amber/5 border-amber/20 text-foreground/80',
    tip: 'bg-success/5 border-success/20 text-foreground/80',
  };
  const labels = { info: 'NOTE', warning: 'IMPORTANT', tip: 'TIP' };
  const labelColors = { info: 'text-teal', warning: 'text-amber', tip: 'text-success' };
  return (
    <div className={`rounded border px-4 py-3 text-sm mt-3 mb-3 ${styles[variant]}`}>
      <span className={`font-mono text-[10px] font-bold tracking-widest mr-2 ${labelColors[variant]}`}>
        {labels[variant]}:
      </span>
      {children}
    </div>
  );
}

function FeatureTag({ label, color = 'teal' }: { label: string; color?: 'teal' | 'amber' | 'purple' | 'orange' | 'red' }) {
  const colors = {
    teal: 'bg-teal/10 border-teal/30 text-teal',
    amber: 'bg-amber/10 border-amber/30 text-amber',
    purple: 'bg-purple-400/10 border-purple-400/30 text-purple-400',
    orange: 'bg-orange-400/10 border-orange-400/30 text-orange-400',
    red: 'bg-danger/10 border-danger/30 text-danger',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono font-semibold tracking-wider ${colors[color]}`}>
      {label}
    </span>
  );
}

const TOC_ITEMS = [
  { id: 'overview', label: 'Application Overview' },
  { id: 'authentication', label: 'Authentication & Login' },
  { id: 'profile-setup', label: 'Profile Setup' },
  { id: 'language-selection', label: 'App Language Selection' },
  { id: 'session-management', label: 'Session Management' },
  { id: 'transcript-input', label: 'Transcript Input & ASR' },
  { id: 'emotion-intent', label: 'Emotion & Intent Panel' },
  { id: 'belief-state', label: 'Belief State Panel' },
  { id: 'pattern-predictions', label: 'Pattern Predictions Panel' },
  { id: 'safety-quality', label: 'Safety & Quality Panel' },
  { id: 'strategy-engine', label: 'Strategy Engine Panel' },
  { id: 'session-summary', label: 'Session Summary Bar' },
  { id: 'ethics-toxicity', label: 'Ethics & Toxicity Indicators' },
];

export default function UserManual() {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Print-only header */}
      <div className="hidden print:flex items-center gap-3 mb-8 pb-4 border-b border-border">
        <img src="/assets/generated/olya-logo.dim_256x256.png" alt="Olya" className="w-10 h-10 object-contain" />
        <div>
          <div className="text-xl font-bold tracking-widest font-mono">OLYA</div>
          <div className="text-xs font-mono text-muted-foreground">STRATEGIC DIALOGUE INTELLIGENCE — USER MANUAL v3.0</div>
        </div>
        <div className="ml-auto text-xs font-mono text-muted-foreground">
          Generated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Screen-only sticky toolbar */}
      <div className="print:hidden sticky top-0 z-40 bg-navy/95 border-b border-border/50 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} />
            Back to App
          </a>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <BookOpen size={13} className="text-teal" />
            <span className="text-xs font-mono text-foreground/70">User Manual</span>
            <FeatureTag label="v3.0" />
          </div>
        </div>
        <Button
          onClick={handlePrint}
          size="sm"
          className="flex items-center gap-2 bg-teal/10 hover:bg-teal/20 text-teal border border-teal/30 text-xs font-mono"
          variant="outline"
        >
          <Printer size={13} />
          Download PDF
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 print:px-0 print:py-0">
        {/* Cover / Title */}
        <div className="mb-10 print:mb-8">
          <div className="flex items-start gap-5 mb-6">
            <div className="print:hidden w-16 h-16 rounded-xl bg-teal/10 border border-teal/30 flex items-center justify-center flex-shrink-0">
              <img src="/assets/generated/olya-logo.dim_256x256.png" alt="Olya" className="w-11 h-11 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold tracking-tight">Olya User Manual</h1>
                <FeatureTag label="v3.0" />
              </div>
              <p className="text-sm font-mono text-muted-foreground mb-3">STRATEGIC DIALOGUE INTELLIGENCE PLATFORM</p>
              <p className="text-sm text-foreground/70 max-w-2xl leading-relaxed">
                This manual provides comprehensive guidance for using the Olya platform — an AI-powered conversation analysis system designed for operators conducting structured dialogues, negotiations, and interviews. It covers all features from authentication through advanced analysis panels.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
            {[
              { label: 'Version', value: '3.0' },
              { label: 'Platform', value: 'Internet Computer' },
              { label: 'ASR Engines', value: '3 Supported' },
              { label: 'Analysis Panels', value: '6 Active' },
            ].map(item => (
              <div key={item.label} className="rounded border border-border/50 bg-card/50 px-3 py-2">
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{item.label}</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mb-8 print:mb-6" />

        {/* Table of Contents */}
        <div className="mb-10 print:mb-8 print:break-after-page">
          <h2 className="text-base font-bold font-mono text-teal uppercase tracking-widest mb-4">Table of Contents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {TOC_ITEMS.map((item, i) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="print:no-underline flex items-center gap-2 px-3 py-2 rounded hover:bg-teal/5 transition-colors group"
              >
                <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{String(i + 1).padStart(2, '0')}</span>
                <ChevronRight size={11} className="text-teal/50 group-hover:text-teal transition-colors" />
                <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        <Separator className="mb-8 print:mb-6" />

        {/* ── SECTION 1: Overview ── */}
        <Section id="overview" icon={<BookOpen size={15} />} title="Application Overview" subtitle="WHAT IS OLYA?">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Olya is an AI-powered Strategic Dialogue Intelligence platform built on the Internet Computer blockchain. It enables operators — negotiators, interviewers, counselors, and analysts — to conduct and analyze conversations in real time using advanced NLP, emotion detection, intent classification, and ethical oversight.
          </p>
          <SubSection title="Core Capabilities">
            <ul className="space-y-2">
              {[
                'Real-time Automatic Speech Recognition (ASR) with three engine options',
                'Emotion and intent detection per transcript entry',
                'Belief state visualization showing trust dynamics between speakers',
                'Pattern prediction engine forecasting conversation trajectory',
                'Safety & Quality metrics including bias detection and hallucination guards',
                'LLaMA+RL Strategy Engine generating context-aware dialogue strategies',
                'Ethical constraints enforcement with automatic violation detection',
                'Session management with persistent storage on the Internet Computer',
              ].map((cap, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal mt-1.5 flex-shrink-0" />
                  {cap}
                </li>
              ))}
            </ul>
          </SubSection>
          <SubSection title="System Architecture">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Frontend', desc: 'React + TypeScript SPA with real-time NLP simulation', color: 'teal' as const },
                { label: 'Backend', desc: 'Motoko canister on Internet Computer for persistent session storage', color: 'amber' as const },
                { label: 'AI Engines', desc: 'Client-side NLP, LLaMA+RL strategy generation, ethics monitoring', color: 'purple' as const },
              ].map(item => (
                <div key={item.label} className="rounded border border-border/50 bg-card/30 p-3">
                  <FeatureTag label={item.label} color={item.color} />
                  <p className="text-xs text-foreground/70 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ── SECTION 2: Authentication ── */}
        <Section id="authentication" icon={<LogIn size={15} />} title="Authentication & Login" subtitle="INTERNET IDENTITY">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Olya uses Internet Identity — a secure, privacy-preserving authentication system built on the Internet Computer. No passwords or email addresses are required. Your identity is cryptographically secured and unique to each device.
          </p>
          <SubSection title="Logging In">
            <StepList steps={[
              'Click the "Login" button in the top-right corner of the application header.',
              'An Internet Identity authentication window will open in your browser.',
              'If you have an existing Internet Identity anchor, enter your anchor number and authenticate using your device (fingerprint, Face ID, or security key).',
              'If you are new to Internet Identity, click "Create New" to register a new identity anchor.',
              'Once authenticated, the window closes and you are returned to Olya. Your name will appear in the header.',
            ]} />
          </SubSection>
          <SubSection title="Logging Out">
            <StepList steps={[
              'Click the "Logout" button in the top-right corner of the header (visible when logged in).',
              'Your session data is cleared from the browser cache.',
              'You are returned to the welcome screen.',
            ]} />
          </SubSection>
          <InfoBox variant="info">
            Internet Identity creates a unique principal ID for each application. Your Olya identity is separate from other Internet Computer applications for privacy.
          </InfoBox>
          <InfoBox variant="warning">
            Keep your Internet Identity anchor number safe. If you lose access to all registered devices, you may not be able to recover your account.
          </InfoBox>
        </Section>

        {/* ── SECTION 3: Profile Setup ── */}
        <Section id="profile-setup" icon={<User size={15} />} title="Profile Setup" subtitle="FIRST-TIME CONFIGURATION">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            On your first login, Olya will prompt you to set up your operator profile. This profile personalizes your experience and identifies you within the system.
          </p>
          <SubSection title="Setting Up Your Profile">
            <StepList steps={[
              'After logging in for the first time, a profile setup modal will appear automatically.',
              'Enter your operator name in the "Name" field. This name will be displayed in the header and associated with your sessions.',
              'Click "Save Profile" to confirm your name.',
              'Your profile is saved to the Internet Computer blockchain and will persist across sessions and devices.',
            ]} />
          </SubSection>
          <InfoBox variant="tip">
            Your profile name is only requested once. On subsequent logins, Olya will recognize your principal ID and load your existing profile automatically.
          </InfoBox>
          <SubSection title="Profile Display">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Once set up, your operator name appears in the header alongside a shield icon (<span className="font-mono text-teal text-xs">OPERATOR</span>), confirming your authenticated status. The principal ID (a long cryptographic identifier) is never displayed to you directly.
            </p>
          </SubSection>
        </Section>

        {/* ── SECTION 4: Language Selection ── */}
        <Section id="language-selection" icon={<Globe size={15} />} title="App Language Selection" subtitle="INTERFACE & TRANSCRIPTION LANGUAGE">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Olya supports over 200 languages for transcription and interface localization. Language preferences are stored locally in your browser.
          </p>
          <SubSection title="Initial Language Setup">
            <StepList steps={[
              'After completing your profile setup, a full-screen language selection overlay appears.',
              'Browse or search for your preferred language using the search box.',
              'Click on your desired language to select it.',
              'Click "Confirm" to save your preference and proceed to the dashboard.',
            ]} />
          </SubSection>
          <SubSection title="Changing Language Later">
            <StepList steps={[
              'Locate the language selector button in the application header (shows the current language code, e.g., "EN" for English).',
              'Click the button to open the compact language popover.',
              'Search for or scroll to your desired language.',
              'Click the language to apply it immediately — no page reload required.',
            ]} />
          </SubSection>
          <InfoBox variant="info">
            The app language preference is stored in your browser's local storage. Clearing browser data will reset this preference, and you will be prompted to select a language again on next login.
          </InfoBox>
          <SubSection title="Transcription Language vs. App Language">
            <p className="text-sm text-foreground/80 leading-relaxed">
              The <strong>App Language</strong> (set in the header) controls the language used for ASR transcription input. A separate <strong>Transcription Language</strong> selector is available within the Transcript Input panel for per-session overrides. Setting it to "Auto-detect" allows the ASR engine to identify the spoken language automatically.
            </p>
          </SubSection>
        </Section>

        {/* ── SECTION 5: Session Management ── */}
        <Section id="session-management" icon={<FolderOpen size={15} />} title="Session Management" subtitle="CREATING, SWITCHING & DELETING SESSIONS">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Sessions are the core organizational unit in Olya. Each session represents a single conversation or interview, storing all transcript entries, analysis results, and metadata on the Internet Computer.
          </p>
          <SubSection title="Creating a New Session">
            <StepList steps={[
              'From the dashboard, click the "New Session" button at the top of the left sidebar.',
              'A new session is created instantly with a unique ID and timestamp.',
              'The session becomes active and the main analysis area is ready for transcript input.',
              'The session is automatically saved to the Internet Computer backend.',
            ]} />
          </SubSection>
          <SubSection title="Switching Between Sessions">
            <StepList steps={[
              'The left sidebar displays all your sessions, sorted by most recent first.',
              'Each session card shows: timestamp, a preview of the last transcript entry, and any pattern or violation badges.',
              'Click any session card to switch to that session and load its data.',
              'The active session is highlighted with a teal border.',
            ]} />
          </SubSection>
          <SubSection title="Session Cards — Information Displayed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {[
                { label: 'Timestamp', desc: 'Date and time the session was created or last updated' },
                { label: 'Transcript Preview', desc: 'First few words of the most recent transcript entry' },
                { label: 'Pattern Badge', desc: 'Indicates detected conversation patterns (e.g., escalation, de-escalation)' },
                { label: 'Violation Badge', desc: 'Red badge shown when ethical violations are detected in the session' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 text-sm">
                  <ChevronRight size={12} className="text-teal mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground/90">{item.label}: </span>
                    <span className="text-foreground/70">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Deleting a Session">
            <StepList steps={[
              'Hover over the session card you wish to delete in the sidebar.',
              'Click the trash/delete icon that appears on the right side of the session card.',
              'Confirm the deletion when prompted.',
              'The session and all its data are permanently removed from the Internet Computer.',
            ]} />
          </SubSection>
          <InfoBox variant="warning">
            Session deletion is permanent and cannot be undone. All transcript entries, analysis results, and metadata for that session will be lost.
          </InfoBox>
        </Section>

        {/* ── SECTION 6: Transcript Input ── */}
        <Section id="transcript-input" icon={<Mic size={15} />} title="Transcript Input & ASR" subtitle="TEXT INPUT, MICROPHONE & ASR ENGINES">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            The Transcript Input panel is the primary interface for adding conversation content to a session. You can type text manually or use one of three Automatic Speech Recognition (ASR) engines to transcribe spoken audio.
          </p>
          <SubSection title="Manual Text Input">
            <StepList steps={[
              'Click in the transcript text area at the bottom of the main content area.',
              'Type or paste the conversation text you wish to analyze.',
              'Select the speaker role for this entry (see Speaker Roles below).',
              'Press Enter or click the "Add" button to submit the entry.',
            ]} />
          </SubSection>
          <SubSection title="Speaker Roles">
            <p className="text-sm text-foreground/80 mb-3">Each transcript entry is tagged with a speaker role, which affects how the analysis engines interpret the content:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { role: 'Operator', desc: 'The interviewer or negotiator conducting the session', color: 'teal' as const },
                { role: 'Subject', desc: 'The person being interviewed or the counterpart', color: 'amber' as const },
                { role: 'Witness', desc: 'A third-party observer or secondary participant', color: 'purple' as const },
                { role: 'Unknown', desc: 'Speaker identity not determined', color: 'orange' as const },
              ].map(item => (
                <div key={item.role} className="rounded border border-border/50 bg-card/30 p-2.5">
                  <FeatureTag label={item.role} color={item.color} />
                  <p className="text-xs text-foreground/60 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="ASR Engine Selection">
            <p className="text-sm text-foreground/80 mb-3">
              Olya supports three ASR engines. Select your preferred engine using the dropdown in the Transcript Input panel. The active engine is also shown in the application header with a color-coded indicator.
            </p>
            <div className="space-y-3">
              {[
                {
                  name: 'Web Speech API',
                  color: 'teal' as const,
                  indicator: 'Teal dot',
                  desc: 'Uses the browser\'s built-in speech recognition. Best for real-time transcription with low latency. Requires a modern browser (Chrome recommended) and microphone permission.',
                  pros: ['Lowest latency', 'No additional setup', 'Continuous recognition'],
                  cons: ['Browser-dependent', 'Requires internet connection for some browsers'],
                },
                {
                  name: 'Whisper',
                  color: 'purple' as const,
                  indicator: 'Purple dot',
                  desc: 'Simulates OpenAI\'s Whisper model processing. Provides higher accuracy for complex speech, accents, and technical vocabulary. Processes audio in segments.',
                  pros: ['Higher accuracy', 'Better accent handling', 'Technical vocabulary support'],
                  cons: ['Slightly higher latency', 'Segment-based processing'],
                },
                {
                  name: 'DeepSpeech',
                  color: 'orange' as const,
                  indicator: 'Orange dot',
                  desc: 'Simulates Mozilla\'s DeepSpeech acoustic model. Optimized for offline-capable transcription with acoustic model processing.',
                  pros: ['Offline-capable simulation', 'Acoustic model processing', 'Privacy-focused'],
                  cons: ['Higher processing overhead', 'Requires more resources'],
                },
              ].map(engine => (
                <div key={engine.name} className="rounded border border-border/50 bg-card/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FeatureTag label={engine.name} color={engine.color} />
                    <span className="text-[10px] font-mono text-muted-foreground">Header indicator: {engine.indicator}</span>
                  </div>
                  <p className="text-xs text-foreground/70 mb-2 leading-relaxed">{engine.desc}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] font-mono text-success uppercase tracking-wider mb-1">Advantages</div>
                      {engine.pros.map(p => <div key={p} className="text-xs text-foreground/60 flex items-start gap-1"><span className="text-success">+</span>{p}</div>)}
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-amber uppercase tracking-wider mb-1">Considerations</div>
                      {engine.cons.map(c => <div key={c} className="text-xs text-foreground/60 flex items-start gap-1"><span className="text-amber">−</span>{c}</div>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Using the Microphone">
            <StepList steps={[
              'Select your preferred ASR engine from the dropdown in the Transcript Input panel.',
              'Click the microphone button to start recording.',
              'Grant microphone permission when prompted by your browser (first time only).',
              'Speak clearly — the transcript text area will populate in real time.',
              'Click the microphone button again (or the stop button) to end recording.',
              'Review the transcribed text, select the speaker role, and click "Add" to submit.',
            ]} />
          </SubSection>
          <InfoBox variant="tip">
            For best results with Web Speech API, use Chrome or Edge. Ensure you are in a quiet environment and speak at a moderate pace. The microphone icon turns red while recording is active.
          </InfoBox>
        </Section>

        {/* ── SECTION 7: Emotion & Intent Panel ── */}
        <Section id="emotion-intent" icon={<Brain size={15} />} title="Emotion & Intent Analysis Panel" subtitle="REAL-TIME NLP ANALYSIS">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            The Emotion & Intent panel provides real-time NLP analysis of each transcript entry, detecting the emotional state and communicative intent of the speaker. This panel updates automatically with each new transcript entry.
          </p>
          <SubSection title="Panel Layout">
            <div className="space-y-2">
              {[
                { label: 'Speaker Role Tag', desc: 'Shows which speaker (Operator/Subject/Witness/Unknown) the current analysis belongs to' },
                { label: 'Emotion Bars', desc: 'Progress bars showing detected emotions (e.g., Neutral, Anger, Fear, Joy, Sadness, Surprise) with percentage confidence scores' },
                { label: 'Intent Bars', desc: 'Progress bars showing detected communicative intents (e.g., Inform, Question, Persuade, Deflect, Threaten, Cooperate) with confidence scores' },
                { label: 'Recent Entries Summary', desc: 'A compact list of the last few entries showing their dominant emotion and intent at a glance' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 text-sm">
                  <ChevronRight size={12} className="text-teal mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground/90">{item.label}: </span>
                    <span className="text-foreground/70">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Interpreting Emotion Scores">
            <p className="text-sm text-foreground/80 leading-relaxed mb-2">
              Emotion scores are expressed as percentages (0–100%). A score above 60% indicates a dominant emotion. Multiple emotions can be present simultaneously, reflecting the complexity of natural speech.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { emotion: 'Neutral', meaning: 'Calm, factual communication' },
                { emotion: 'Anger', meaning: 'Frustration, hostility, or aggression' },
                { emotion: 'Fear', meaning: 'Anxiety, uncertainty, or threat response' },
                { emotion: 'Joy', meaning: 'Positive affect, agreement, enthusiasm' },
                { emotion: 'Sadness', meaning: 'Distress, resignation, or loss' },
                { emotion: 'Surprise', meaning: 'Unexpected information or reaction' },
              ].map(item => (
                <div key={item.emotion} className="text-xs rounded border border-border/40 bg-card/20 px-2.5 py-2">
                  <div className="font-semibold text-foreground/90 mb-0.5">{item.emotion}</div>
                  <div className="text-foreground/60">{item.meaning}</div>
                </div>
              ))}
            </div>
          </SubSection>
          <InfoBox variant="info">
            Emotion and intent detection is performed client-side using heuristic NLP simulation. Results are indicative and should be interpreted alongside other contextual information.
          </InfoBox>
        </Section>

        {/* ── SECTION 8: Belief State Panel ── */}
        <Section id="belief-state" icon={<Activity size={15} />} title="Belief State Visualization Panel" subtitle="TRUST DYNAMICS & RELATIONSHIP MAPPING">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            The Belief State panel provides a visual representation of the trust and relationship dynamics between conversation participants. It uses a canvas-based graph to show how beliefs and trust levels evolve throughout the session.
          </p>
          <SubSection title="Graph Elements">
            <div className="space-y-2">
              {[
                { label: 'Central Trust Node', desc: 'The large central node represents the overall trust level of the conversation. Its size and color intensity reflect the aggregate trust score.' },
                { label: 'Speaker Orbit Nodes', desc: 'Smaller nodes orbit the center, one per speaker role (Operator, Subject, Witness, Unknown). Each node shows the entry count for that speaker.' },
                { label: 'Persuasion Arc', desc: 'A curved arc connecting nodes indicates active persuasion dynamics between speakers.' },
                { label: 'Concerns Overlay', desc: 'Red or amber overlays appear when ethical concerns or high-tension indicators are detected in recent entries.' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 text-sm">
                  <ChevronRight size={12} className="text-teal mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground/90">{item.label}: </span>
                    <span className="text-foreground/70">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Reading the Belief State">
            <StepList steps={[
              'Observe the central node size — larger indicates higher overall trust/rapport.',
              'Check orbit node distances — nodes closer to the center indicate higher engagement from that speaker.',
              'Look for the persuasion arc — its presence indicates one speaker is actively attempting to influence another.',
              'Monitor the concerns overlay — red overlays signal immediate ethical or safety concerns requiring attention.',
            ]} />
          </SubSection>
        </Section>

        {/* ── SECTION 9: Pattern Predictions Panel ── */}
        <Section id="pattern-predictions" icon={<BarChart2 size={15} />} title="Pattern Predictions Panel" subtitle="CONVERSATION TRAJECTORY FORECASTING">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            The Pattern Predictions panel uses a client-side heuristic engine to analyze transcript trends and forecast the likely trajectory of the conversation. Predictions are updated with each new entry.
          </p>
          <InfoBox variant="warning">
            The Pattern Predictions panel requires at least 3 transcript entries before generating predictions. With fewer entries, a "Building baseline..." placeholder is shown.
          </InfoBox>
          <SubSection title="Prediction Cards">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { card: 'Next Emotion', desc: 'Predicts the most likely emotional state of the next speaker turn based on emotional trajectory analysis.' },
                { card: 'Next Intent', desc: 'Forecasts the probable communicative intent of the next utterance (e.g., likely to question, deflect, or cooperate).' },
                { card: 'Conversation Direction', desc: 'Assesses whether the conversation is trending toward escalation, de-escalation, resolution, or stalemate.' },
                { card: 'Action Window', desc: 'Identifies the optimal timing for specific operator interventions based on current conversation dynamics.' },
              ].map(item => (
                <div key={item.card} className="rounded border border-border/50 bg-card/30 p-3">
                  <div className="text-xs font-mono font-semibold text-teal mb-1">{item.card}</div>
                  <p className="text-xs text-foreground/70 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Hallucination Guard Annotations">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Each prediction card may display a <FeatureTag label="HALLUCINATION GUARD" color="amber" /> annotation. This indicates the prediction engine has detected potential fabricated specificity — claims that appear overly precise without sufficient data support. When this annotation appears, treat the prediction with additional caution.
            </p>
          </SubSection>
        </Section>

        {/* ── SECTION 10: Safety & Quality Panel ── */}
        <Section id="safety-quality" icon={<Shield size={15} />} title="Safety & Quality Metrics Panel" subtitle="BIAS, HALLUCINATION & TRUSTWORTHINESS">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            The Safety & Quality panel provides a real-time dashboard of four critical metrics that monitor the integrity and quality of the conversation analysis. These metrics help operators maintain ethical standards and assess the reliability of AI-generated insights.
          </p>
          <SubSection title="The Four Metrics">
            <div className="space-y-3">
              {[
                {
                  metric: 'Bias Incidents',
                  color: 'teal' as const,
                  desc: 'Counts the number of detected bias instances across all transcript entries. Bias categories include gender, racial, socioeconomic, and confirmation bias.',
                  thresholds: [
                    { range: '0', status: 'Green — No bias detected', color: 'text-success' },
                    { range: '1–3', status: 'Amber — Low bias, monitor closely', color: 'text-amber' },
                    { range: '4+', status: 'Red — High bias, review required', color: 'text-danger' },
                  ],
                },
                {
                  metric: 'Hallucination Flag Rate',
                  color: 'amber' as const,
                  desc: 'Percentage of transcript entries flagged by the hallucination guard for containing potentially fabricated specificity (unsupported claims, invented statistics, unverifiable references).',
                  thresholds: [
                    { range: '0–10%', status: 'Green — Acceptable rate', color: 'text-success' },
                    { range: '11–30%', status: 'Amber — Elevated, review flagged entries', color: 'text-amber' },
                    { range: '31%+', status: 'Red — High rate, significant concern', color: 'text-danger' },
                  ],
                },
                {
                  metric: 'Ethical Violations',
                  color: 'red' as const,
                  desc: 'Total count of ethical constraint violations detected. Violation types include personal attacks, manipulative framing, dehumanizing language, and coercive pressure tactics.',
                  thresholds: [
                    { range: '0', status: 'Green — No violations', color: 'text-success' },
                    { range: '1–2', status: 'Amber — Minor violations detected', color: 'text-amber' },
                    { range: '3+', status: 'Red — Serious violations, immediate review', color: 'text-danger' },
                  ],
                },
                {
                  metric: 'Trustworthiness Score',
                  color: 'purple' as const,
                  desc: 'A composite 0–100 score calculated by applying weighted penalties for bias incidents, ethical violations, and hallucination flag rates. Displayed as a circular gauge.',
                  thresholds: [
                    { range: '80–100', status: 'Green — High trustworthiness', color: 'text-success' },
                    { range: '50–79', status: 'Amber — Moderate, some concerns', color: 'text-amber' },
                    { range: '0–49', status: 'Red — Low trustworthiness, significant issues', color: 'text-danger' },
                  ],
                },
              ].map(item => (
                <div key={item.metric} className="rounded border border-border/50 bg-card/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FeatureTag label={item.metric} color={item.color} />
                  </div>
                  <p className="text-xs text-foreground/70 mb-2 leading-relaxed">{item.desc}</p>
                  <div className="space-y-0.5">
                    {item.thresholds.map(t => (
                      <div key={t.range} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-muted-foreground w-12 text-right">{t.range}</span>
                        <span className="text-border">→</span>
                        <span className={t.color}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ── SECTION 11: Strategy Engine Panel ── */}
        <Section id="strategy-engine" icon={<Zap size={15} />} title="Strategy Engine Panel" subtitle="LLaMA+RL DIALOGUE STRATEGY GENERATION">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            The Strategy Engine panel is powered by a simulated LLaMA+RL (Large Language Model + Reinforcement Learning) engine. It analyzes the current conversation context and generates ranked dialogue strategy recommendations for the operator.
          </p>
          <SubSection title="How It Works">
            <StepList steps={[
              'The engine builds a context window from recent transcript entries, incorporating emotion, intent, speaker role, and ethical flags.',
              'Reinforcement Learning reward weights are dynamically updated based on conversation outcomes (de-escalation success, ethical compliance, rapport building).',
              'Multiple strategy candidates are scored against the RL reward model.',
              'The top-ranked strategies are displayed with confidence scores and RL reward breakdowns.',
            ]} />
          </SubSection>
          <SubSection title="Strategy Cards">
            <div className="space-y-2">
              {[
                { label: 'Strategy Text', desc: 'The recommended dialogue approach or specific phrasing suggestion' },
                { label: 'RL Confidence Score', desc: 'A 0–100 score indicating how strongly the RL model recommends this strategy given the current context' },
                { label: 'RLScoreBadge', desc: 'Color-coded badge (green/amber/red) reflecting confidence level at a glance' },
                { label: 'Reward Weight Breakdown', desc: 'Shows the individual RL reward components (e.g., de-escalation weight, rapport weight, ethical compliance weight) that contributed to the score' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 text-sm">
                  <ChevronRight size={12} className="text-teal mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground/90">{item.label}: </span>
                    <span className="text-foreground/70">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Ethical Constraints & Hallucination Guard">
            <p className="text-sm text-foreground/80 leading-relaxed">
              All generated strategies are automatically screened by the ethical constraints enforcement module and the hallucination guard before display. Strategies that violate ethical rules are filtered out. Strategies with potential hallucination signals are annotated with a warning badge. This ensures all recommendations meet the platform's ethical standards.
            </p>
          </SubSection>
          <InfoBox variant="tip">
            Strategies with RL confidence scores above 75 are generally reliable. Scores below 50 indicate the engine has insufficient context — add more transcript entries to improve recommendation quality.
          </InfoBox>
        </Section>

        {/* ── SECTION 12: Session Summary Bar ── */}
        <Section id="session-summary" icon={<BarChart2 size={15} />} title="Session Summary Bar" subtitle="AT-A-GLANCE SESSION METRICS">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            The Session Summary Bar appears at the top of the main content area when a session is active. It provides a quick overview of the session's key metrics, updated in real time as new transcript entries are added.
          </p>
          <SubSection title="Summary Metrics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { metric: 'Health Score', desc: 'Overall conversation health on a 0–100 scale, factoring in emotional balance, ethical compliance, and dialogue quality.' },
                { metric: 'Exchange Count', desc: 'Total number of transcript entries in the current session.' },
                { metric: 'Dominant Emotion', desc: 'The most frequently detected emotion across all entries in the session.' },
                { metric: 'Top Strategy', desc: 'The highest-confidence strategy recommendation from the LLaMA+RL engine for the current session context.' },
                { metric: 'Bias Incident Count', desc: 'Total bias incidents detected across all entries. Color-coded: green (0), amber (1–3), red (4+).' },
              ].map(item => (
                <div key={item.metric} className="rounded border border-border/50 bg-card/30 p-3">
                  <div className="text-xs font-mono font-semibold text-teal mb-1">{item.metric}</div>
                  <p className="text-xs text-foreground/70 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ── SECTION 13: Ethics & Toxicity ── */}
        <Section id="ethics-toxicity" icon={<AlertTriangle size={15} />} title="Ethics & Toxicity Indicators" subtitle="VIOLATION BADGES & CONTENT MODERATION">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Olya enforces ethical standards throughout the conversation analysis pipeline. Multiple layers of detection and enforcement work together to identify and flag problematic content.
          </p>
          <SubSection title="Ethics Badge System">
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              Each transcript entry in the Transcript Panel is evaluated by the ethical constraints enforcement module. Entries that trigger violations display a prominent <FeatureTag label="ETHICS VIOLATION" color="red" /> badge.
            </p>
            <div className="space-y-2">
              {[
                { type: 'Personal Attack', desc: 'Language that demeans, berates, or directly attacks an individual' },
                { type: 'Manipulative Framing', desc: 'Distorted, misrepresented, or spin-framed statements designed to mislead' },
                { type: 'Dehumanizing Language', desc: 'Content that objectifies or treats individuals as less than human' },
                { type: 'Coercive Pressure', desc: 'Threats, forced compliance, or manipulative pressure tactics' },
              ].map(item => (
                <div key={item.type} className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={12} className="text-danger mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground/90">{item.type}: </span>
                    <span className="text-foreground/70">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Content Sanitization">
            <p className="text-sm text-foreground/80 leading-relaxed">
              When an ethical violation is detected in a transcript entry, the Transcript Panel displays a <strong>sanitized version</strong> of the text rather than the original content. The original text is preserved in the session data but replaced with a cleaned version in the UI to prevent reinforcement of harmful language. A tooltip on the violation badge explains the specific violation type detected.
            </p>
          </SubSection>
          <SubSection title="Bias Category Detection">
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              The bias detection system identifies four categories of bias in transcript content:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { category: 'Gender Bias', keywords: 'Gendered language, stereotypes' },
                { category: 'Racial Bias', keywords: 'Race, ethnicity, discrimination' },
                { category: 'Socioeconomic Bias', keywords: 'Wealth, class, income references' },
                { category: 'Confirmation Bias', keywords: 'Stereotypes, assumptions, prejudice' },
              ].map(item => (
                <div key={item.category} className="rounded border border-border/40 bg-card/20 p-2.5">
                  <div className="text-xs font-semibold text-foreground/90 mb-0.5">{item.category}</div>
                  <div className="text-[10px] text-foreground/50">{item.keywords}</div>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Toxicity Flags">
            <p className="text-sm text-foreground/80 leading-relaxed">
              In addition to ethical violations, the system flags entries for general toxicity. Toxicity flags appear as badges on individual transcript entries and are counted in the Safety & Quality panel's metrics. Entries with toxicity flags are highlighted in the Transcript Panel for easy identification.
            </p>
          </SubSection>
          <InfoBox variant="warning">
            Ethics and toxicity detection is performed using pattern-matching heuristics. While comprehensive, it may not catch all violations or may occasionally flag benign content. Human review of flagged content is always recommended.
          </InfoBox>
        </Section>

        <Separator className="my-8 print:my-6" />

        {/* Footer */}
        <footer className="text-center py-6 print:py-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/assets/generated/olya-logo.dim_256x256.png" alt="Olya" className="w-6 h-6 object-contain opacity-60" />
            <span className="text-xs font-mono text-muted-foreground">OLYA v3.0 — STRATEGIC DIALOGUE INTELLIGENCE</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            © {new Date().getFullYear()} Olya. Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'olya-app')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:underline print:no-underline"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/50">
            Document generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </footer>
      </div>
    </div>
  );
}
