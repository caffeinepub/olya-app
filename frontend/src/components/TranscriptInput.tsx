import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useLanguagePreference } from '@/hooks/useLanguagePreference';
import LanguageSelector from '@/components/LanguageSelector';
import { cn } from '@/lib/utils';

export type SpeakerRole = 'Operator' | 'Subject' | 'Witness' | 'Unknown';

export const SPEAKER_ROLES: SpeakerRole[] = [
  'Operator',
  'Subject',
  'Witness',
  'Unknown',
];

export const SPEAKER_COLORS: Record<SpeakerRole, string> = {
  Operator: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  Subject: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  Witness: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  Unknown: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
};

interface TranscriptInputProps {
  onSubmit: (text: string, speaker: SpeakerRole) => void;
  disabled?: boolean;
}

export default function TranscriptInput({
  onSubmit,
  disabled = false,
}: TranscriptInputProps) {
  const [text, setText] = useState('');
  const [speaker, setSpeaker] = useState<SpeakerRole>('Operator');
  const [interimText, setInterimText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { language, setLanguage } = useLanguagePreference();

  const handleInterimResult = useCallback((interim: string) => {
    setInterimText(interim);
  }, []);

  const handleFinalResult = useCallback((final: string) => {
    setText((prev) => {
      const trimmed = prev.trimEnd();
      return trimmed ? trimmed + ' ' + final : final;
    });
    setInterimText('');
  }, []);

  const {
    isListening,
    isSupported,
    error: asrError,
    detectedLanguage,
    toggleListening,
    stopListening,
    clearError,
  } = useSpeechRecognition({
    onInterimResult: handleInterimResult,
    onFinalResult: handleFinalResult,
    lang: language,
  });

  const handleSubmit = useCallback(() => {
    const finalText = (text + (interimText ? ' ' + interimText : '')).trim();
    if (!finalText) return;

    // Stop microphone if active
    if (isListening) {
      stopListening();
    }
    setInterimText('');

    onSubmit(finalText, speaker);
    setText('');
    textareaRef.current?.focus();
  }, [text, interimText, isListening, stopListening, onSubmit, speaker]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Auto-clear ASR error after 5 seconds
  useEffect(() => {
    if (asrError) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [asrError, clearError]);

  const displayText = text + (interimText ? (text ? ' ' : '') + interimText : '');
  const canSubmit = (text.trim() || interimText.trim()) && !disabled;

  const asrErrorMessage: Record<string, string> = {
    'not-supported': 'Speech recognition is not supported in this browser.',
    'permission-denied': 'Microphone access denied. Please allow microphone permissions.',
    'no-speech': 'No speech detected. Please try again.',
    'audio-capture': 'No microphone found. Please connect a microphone.',
    network: 'Network error during speech recognition.',
    unknown: 'Speech recognition error. Please try again.',
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Speaker + Language selectors row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Speaker selector */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select
            value={speaker}
            onValueChange={(v) => setSpeaker(v as SpeakerRole)}
            disabled={disabled}
          >
            <SelectTrigger className="w-40 h-8 text-xs bg-background/50 border-border/50">
              <SelectValue placeholder="Speaker" />
            </SelectTrigger>
            <SelectContent>
              {SPEAKER_ROLES.map((role) => (
                <SelectItem key={role} value={role} className="text-xs">
                  <span className={cn('font-medium', SPEAKER_COLORS[role].split(' ')[0])}>
                    {role}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language selector */}
        <LanguageSelector
          selectedLanguage={language}
          onLanguageChange={setLanguage}
          detectedLanguage={detectedLanguage}
          disabled={disabled}
        />
      </div>

      {/* ASR error message */}
      {asrError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{asrErrorMessage[asrError] ?? asrErrorMessage.unknown}</span>
        </div>
      )}

      {/* Textarea + controls */}
      <div className="relative flex gap-2 items-end">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={displayText}
            onChange={(e) => {
              // Only update the committed text; interim is overlaid
              setText(e.target.value);
              setInterimText('');
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening… speak now'
                : 'Type transcript or use microphone… (Ctrl+Enter to submit)'
            }
            disabled={disabled}
            rows={3}
            className={cn(
              'resize-none text-sm bg-background/50 border-border/50 pr-2 transition-all',
              isListening && 'border-primary/60 ring-1 ring-primary/30',
              interimText && 'text-muted-foreground'
            )}
          />
          {isListening && (
            <span className="absolute top-2 right-2 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {/* Microphone button */}
          {isSupported ? (
            <Button
              type="button"
              variant={isListening ? 'default' : 'outline'}
              size="icon"
              onClick={toggleListening}
              disabled={disabled}
              title={isListening ? 'Stop microphone' : 'Start microphone'}
              className={cn(
                'h-9 w-9 transition-all',
                isListening &&
                  'bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-pulse'
              )}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled
              title="Speech recognition not supported"
              className="h-9 w-9 opacity-40"
            >
              <MicOff className="w-4 h-4" />
            </Button>
          )}

          {/* Submit button */}
          <Button
            type="button"
            size="icon"
            onClick={handleSubmit}
            disabled={!canSubmit}
            title="Submit (Ctrl+Enter)"
            className="h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/60">
        Ctrl+Enter to submit · Mic button for speech input
      </p>
    </div>
  );
}
