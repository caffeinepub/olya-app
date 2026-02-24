import React from 'react';
import { Shield } from 'lucide-react';
import LoginButton from './LoginButton';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';

export default function AppHeader() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: userProfile } = useGetCallerUserProfile();

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-navy/90 border-b border-border/50 backdrop-blur-sm z-50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src="/assets/generated/olya-logo.dim_256x256.png"
            alt="Olya"
            className="w-8 h-8 object-contain"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold tracking-widest text-foreground">OLYA</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-teal/30 bg-teal/10 text-teal">
              v2.1
            </span>
          </div>
          <p className="text-[9px] font-mono text-muted-foreground/50 tracking-wider">
            STRATEGIC DIALOGUE INTELLIGENCE
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-4 text-[9px] font-mono text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <span className="status-dot w-1.5 h-1.5" />
            ASR ONLINE
          </span>
          <span className="flex items-center gap-1">
            <span className="status-dot w-1.5 h-1.5" />
            NLP ONLINE
          </span>
          <span className="flex items-center gap-1">
            <span className="status-dot status-dot-amber w-1.5 h-1.5" />
            ETHICS MONITOR
          </span>
        </div>

        {isAuthenticated && userProfile && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border/40 bg-muted/20">
            <Shield size={10} className="text-teal/60" />
            <span className="text-[10px] font-mono text-foreground/70">{userProfile.name}</span>
          </div>
        )}

        <LoginButton />
      </div>
    </header>
  );
}
