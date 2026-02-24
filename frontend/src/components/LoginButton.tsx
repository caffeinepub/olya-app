import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoggingIn}
      size="sm"
      variant={isAuthenticated ? 'ghost' : 'default'}
      className={
        isAuthenticated
          ? 'h-7 text-[10px] font-mono border border-border/50 text-muted-foreground hover:text-foreground hover:border-border px-2'
          : 'h-7 text-[10px] font-mono bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal px-3'
      }
    >
      {isLoggingIn ? (
        <>
          <Loader2 size={10} className="mr-1 animate-spin" />
          Authenticating...
        </>
      ) : isAuthenticated ? (
        <>
          <LogOut size={10} className="mr-1" />
          Logout
        </>
      ) : (
        <>
          <LogIn size={10} className="mr-1" />
          Login
        </>
      )}
    </Button>
  );
}
