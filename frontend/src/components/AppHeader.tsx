import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Activity, Shield, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import LoginButton from './LoginButton';
import { AppLanguageSelectorCompact } from './AppLanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import ThemeSettingsPanel from './ThemeSettingsPanel';

interface AppHeaderProps {
  asrEngine?: string;
  isNlpActive?: boolean;
  isEthicsActive?: boolean;
}

const ENGINE_LABELS: Record<string, string> = {
  webSpeech: 'Web Speech',
  whisper: 'Whisper',
  deepspeech: 'DeepSpeech',
};

export default function AppHeader({ asrEngine = 'webSpeech', isNlpActive = false, isEthicsActive = false }: AppHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <img src="/assets/generated/olya-logo.dim_256x256.png" alt="Olya" className="h-7 w-7 rounded" />
          <span className="font-bold text-base tracking-tight hidden sm:block">Olya</span>
        </div>

        {/* Status indicators */}
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1 h-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {ENGINE_LABELS[asrEngine] || asrEngine}
          </Badge>
          <Badge
            variant={isNlpActive ? 'default' : 'outline'}
            className="text-xs gap-1 h-6"
          >
            <Activity className="w-3 h-3" />
            {t('header.nlpMonitor')}
            <span className="ml-1 opacity-70">{isNlpActive ? t('header.active') : t('header.inactive')}</span>
          </Badge>
          <Badge
            variant={isEthicsActive ? 'default' : 'outline'}
            className="text-xs gap-1 h-6"
          >
            <Shield className="w-3 h-3" />
            {t('header.ethicsMonitor')}
            <span className="ml-1 opacity-70">{isEthicsActive ? t('header.active') : t('header.inactive')}</span>
          </Badge>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex items-center gap-1.5 h-8 text-xs"
            onClick={() => navigate({ to: '/user-manual' })}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t('header.userManual')}
          </Button>

          {/* Theme Settings Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="App Visual Theme"
                title="App Visual Theme"
              >
                <Palette className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="p-0 w-auto border-border bg-popover shadow-lg"
            >
              <ThemeSettingsPanel />
            </PopoverContent>
          </Popover>

          <AppLanguageSelectorCompact />
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
