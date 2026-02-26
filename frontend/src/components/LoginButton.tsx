import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

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

  const buttonText = isLoggingIn
    ? t('login.loggingIn')
    : isAuthenticated
    ? t('login.logoutButton')
    : t('login.loginButton');

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoggingIn}
      variant={isAuthenticated ? 'outline' : 'default'}
      size="sm"
      className="h-8 text-xs gap-1.5"
    >
      {isLoggingIn ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isAuthenticated ? (
        <LogOut className="w-3.5 h-3.5" />
      ) : (
        <LogIn className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">{buttonText}</span>
    </Button>
  );
}
