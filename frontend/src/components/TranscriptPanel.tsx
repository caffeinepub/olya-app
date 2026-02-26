import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Languages, ChevronDown, ChevronUp } from 'lucide-react';
import type { TranscriptEntry, SpeakerRole } from '../hooks/useDashboardState';
import { useAppLanguagePreference } from '../hooks/useAppLanguagePreference';
import { useTranslation } from '../hooks/useTranslation';

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  onToggleTranslation: (index: number) => void;
  onTranslateEntry: (index: number, targetLanguage: string) => void;
}

const SPEAKER_COLORS: Record<SpeakerRole, string> = {
  Operator: 'bg-primary text-primary-foreground',
  Subject: 'bg-secondary text-secondary-foreground',
  Witness: 'bg-accent text-accent-foreground',
  Unknown: 'bg-muted text-muted-foreground',
};

const LANG_DISPLAY: Record<string, string> = {
  en: 'EN', es: 'ES', fr: 'FR', de: 'DE',
  ar: 'AR', zh: 'ZH', pt: 'PT', ru: 'RU', it: 'IT', hi: 'HI',
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function TranscriptPanel({ entries, onToggleTranslation, onTranslateEntry }: TranscriptPanelProps) {
  const { language: appLanguage } = useAppLanguagePreference();
  const { t } = useTranslation();

  const handleToggleTranslation = (index: number, entry: TranscriptEntry) => {
    if (!entry.translatedText) {
      onTranslateEntry(index, appLanguage || 'en');
    }
    onToggleTranslation(index);
  };

  const shouldShowTranslationToggle = (entry: TranscriptEntry): boolean => {
    const entryLang = entry.detectedLanguage;
    if (!entryLang || entryLang === 'unknown') return false;
    return entryLang !== (appLanguage || 'en');
  };

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No transcript entries yet. Start speaking or type below.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-64 pr-2">
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const langCode = entry.detectedLanguage;
            const langDisplay = langCode && langCode !== 'unknown' ? (LANG_DISPLAY[langCode] || langCode.toUpperCase()) : null;
            const showTranslationToggle = shouldShowTranslationToggle(entry);

            return (
              <div key={index} className="rounded-lg border border-border bg-card p-3 space-y-2">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${SPEAKER_COLORS[entry.speaker]}`}>
                      {entry.speaker}
                    </Badge>
                    {langDisplay && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs font-mono px-1.5 py-0.5 flex items-center gap-1">
                            <Languages className="w-3 h-3" />
                            {langDisplay}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Detected language: {langCode.toUpperCase()}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {entry.toxicityFlags.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="destructive" className="text-xs">
                            Ethics Violation
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{entry.toxicityFlags.map((f) => f.flagType).join(', ')}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTime(entry.timestamp)}</span>
                </div>

                {/* Entry text */}
                <p className="text-sm leading-relaxed">{entry.text}</p>

                {/* Emotions & Intents */}
                <div className="flex flex-wrap gap-1">
                  {entry.emotions.slice(0, 2).map((e) => (
                    <Badge key={e.emotionType} variant="secondary" className="text-xs capitalize">
                      {e.emotionType}
                    </Badge>
                  ))}
                  {entry.intents.slice(0, 2).map((i) => (
                    <Badge key={i.intentType} variant="outline" className="text-xs capitalize">
                      {i.intentType.replace(/-/g, ' ')}
                    </Badge>
                  ))}
                </div>

                {/* Translation toggle */}
                {showTranslationToggle && (
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => handleToggleTranslation(index, entry)}
                    >
                      {entry.showTranslation ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          {t('transcript.hideTranslation')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          {t('transcript.showTranslation')}
                        </>
                      )}
                    </Button>
                    {entry.showTranslation && entry.translatedText && (
                      <div className="rounded bg-muted/50 p-2 space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">
                          {t('transcript.translatedFrom')} {langDisplay}:
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground italic">
                          {entry.translatedText}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
}
