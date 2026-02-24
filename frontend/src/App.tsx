import React from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import AppHeader from './components/AppHeader';
import LoginButton from './components/LoginButton';
import ProfileSetupModal from './components/ProfileSetupModal';
import Dashboard from './pages/Dashboard';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup =
    isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AppHeader />

      {showProfileSetup && <ProfileSetupModal />}

      <main className="flex-1 flex flex-col overflow-hidden">
        {isInitializing ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="status-dot w-3 h-3" />
              <p className="text-xs font-mono text-muted-foreground animate-pulse">
                Initializing Olya Intelligence System...
              </p>
            </div>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
              <img
                src="/assets/generated/olya-logo.dim_256x256.png"
                alt="Olya App"
                className="w-24 h-24 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2 font-mono tracking-tight">
                  OLYA <span className="text-teal">INTELLIGENCE</span>
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI-Driven Strategic Dialogue Intelligence System. Real-time NLP
                  analysis, emotion detection, and strategy recommendations for
                  high-stakes negotiations.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full text-center">
                {[
                  { label: 'ASR', sub: 'Web Speech API' },
                  { label: 'NLP', sub: 'BERT/RoBERTa' },
                  { label: 'Strategy', sub: 'LLM+RL' },
                ].map((item) => (
                  <div key={item.label} className="panel-base p-3">
                    <p className="text-xs font-mono font-bold text-teal">{item.label}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                      {item.sub}
                    </p>
                  </div>
                ))}
              </div>
              <LoginButton />
              <p className="text-[10px] font-mono text-muted-foreground/40">
                Secure authentication required to access intelligence systems
              </p>
            </div>
          </div>
        ) : (
          <Dashboard />
        )}
      </main>

      <footer className="border-t border-border/30 py-2 px-4 flex items-center justify-between bg-navy/50">
        <p className="text-[9px] font-mono text-muted-foreground/40">
          © {new Date().getFullYear()} Olya Intelligence System · ASR: Web Speech
          API · NLP: BERT-Sim · Ethics: Bias+Toxicity Detection
        </p>
        <p className="text-[9px] font-mono text-muted-foreground/40">
          Built with{' '}
          <span className="text-red-400/60">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname || 'olya-app'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal/60 hover:text-teal transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
