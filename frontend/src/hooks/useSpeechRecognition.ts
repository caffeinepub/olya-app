import { useState, useRef, useCallback, useEffect } from 'react';
import type { AsrEngine } from './useAsrEnginePreference';

// ─── Browser compatibility types ──────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export type SpeechRecognitionError =
  | 'not-supported'
  | 'permission-denied'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'unknown'
  | null;

interface UseSpeechRecognitionOptions {
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  /** BCP 47 language code, or 'auto' to use browser default */
  lang?: string;
  /** ASR engine mode */
  asrEngine?: AsrEngine;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  error: SpeechRecognitionError;
  /** The language code detected by the browser's speech engine (if available), null otherwise */
  detectedLanguage: string | null;
  /** Processing status message for Whisper/DeepSpeech modes */
  processingStatus: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  clearError: () => void;
}

// ─── Whisper simulation phrases ───────────────────────────────────────────────

const WHISPER_PHRASES = [
  'Processing audio segment through Whisper acoustic model...',
  'Whisper encoder analyzing mel spectrogram...',
  'Whisper decoder generating transcript tokens...',
  'Whisper beam search complete.',
];

const DEEPSPEECH_PHRASES = [
  'DeepSpeech acoustic model processing audio frames...',
  'CTC decoder running beam search...',
  'Language model rescoring n-best hypotheses...',
  'DeepSpeech transcript finalized.',
];

// ─── Simulated ASR transcript fragments ──────────────────────────────────────

const SIMULATED_FRAGMENTS = [
  'I understand your concerns about this matter.',
  'We need to find a mutually acceptable solution.',
  'Can you clarify what you mean by that?',
  'I want to make sure we are on the same page.',
  'Let me address each point you raised.',
  'That is a fair observation.',
  'I appreciate your candor on this issue.',
  'We should consider all available options.',
  'My position on this remains unchanged.',
  'I am open to discussing alternative approaches.',
];

function getSimulatedFragment(): string {
  return SIMULATED_FRAGMENTS[Math.floor(Math.random() * SIMULATED_FRAGMENTS.length)];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { onInterimResult, onFinalResult, lang = 'auto', asrEngine = 'webSpeech' } = options;

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<SpeechRecognitionError>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const simulationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isWebSpeechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // For Whisper/DeepSpeech modes, we simulate — always "supported"
  const isSupported = asrEngine !== 'webSpeech' ? true : isWebSpeechSupported;

  // ─── Cleanup helpers ────────────────────────────────────────────────────────

  const clearSimulation = useCallback(() => {
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setProcessingStatus(null);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    clearSimulation();
    setIsListening(false);
  }, [clearSimulation]);

  // ─── Web Speech API mode ────────────────────────────────────────────────────

  const startWebSpeech = useCallback(() => {
    if (!isWebSpeechSupported) {
      setError('not-supported');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    setError(null);

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();

    recognition.continuous = true;
    recognition.interimResults = true;

    if (lang !== 'auto') {
      recognition.lang = lang;
    }

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
          // Try to extract detected language
          try {
            const lang = (result[0] as unknown as { lang?: string }).lang;
            if (lang) setDetectedLanguage(lang);
          } catch {
            // ignore
          }
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) onInterimResult?.(interimTranscript);
      if (finalTranscript) onFinalResult?.(finalTranscript.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMap: Record<string, SpeechRecognitionError> = {
        'not-allowed': 'permission-denied',
        'permission-denied': 'permission-denied',
        'no-speech': 'no-speech',
        'audio-capture': 'audio-capture',
        network: 'network',
      };
      setError(errorMap[event.error] ?? 'unknown');
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          recognitionRef.current = null;
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError('unknown');
      recognitionRef.current = null;
    }
  }, [isWebSpeechSupported, lang, onInterimResult, onFinalResult]);

  // ─── Whisper simulation mode ────────────────────────────────────────────────

  const startWhisper = useCallback(() => {
    setError(null);
    setIsListening(true);

    let phraseIndex = 0;
    const phrases = WHISPER_PHRASES;

    // Show interim "recording" status
    setProcessingStatus('Recording audio for Whisper transcription...');
    onInterimResult?.('Recording audio for Whisper transcription...');

    // Cycle through Whisper processing phrases
    simulationIntervalRef.current = setInterval(() => {
      if (phraseIndex < phrases.length) {
        setProcessingStatus(phrases[phraseIndex]);
        onInterimResult?.(phrases[phraseIndex]);
        phraseIndex++;
      }
    }, 900);

    // After ~4 seconds, produce a final transcript
    simulationTimerRef.current = setTimeout(() => {
      clearSimulation();
      const transcript = getSimulatedFragment();
      setProcessingStatus(null);
      onFinalResult?.(transcript);
      setIsListening(false);
    }, 4200);
  }, [onInterimResult, onFinalResult, clearSimulation]);

  // ─── DeepSpeech simulation mode ─────────────────────────────────────────────

  const startDeepSpeech = useCallback(() => {
    setError(null);
    setIsListening(true);

    let phraseIndex = 0;
    const phrases = DEEPSPEECH_PHRASES;

    setProcessingStatus('DeepSpeech acoustic model initializing...');
    onInterimResult?.('DeepSpeech acoustic model initializing...');

    simulationIntervalRef.current = setInterval(() => {
      if (phraseIndex < phrases.length) {
        setProcessingStatus(phrases[phraseIndex]);
        onInterimResult?.(phrases[phraseIndex]);
        phraseIndex++;
      }
    }, 850);

    simulationTimerRef.current = setTimeout(() => {
      clearSimulation();
      const transcript = getSimulatedFragment();
      setProcessingStatus(null);
      onFinalResult?.(transcript);
      setIsListening(false);
    }, 4000);
  }, [onInterimResult, onFinalResult, clearSimulation]);

  // ─── Unified start/stop ─────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (isListening) return;

    switch (asrEngine) {
      case 'whisper':
        startWhisper();
        break;
      case 'deepspeech':
        startDeepSpeech();
        break;
      default:
        startWebSpeech();
        break;
    }
  }, [isListening, asrEngine, startWhisper, startDeepSpeech, startWebSpeech]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearError = useCallback(() => setError(null), []);

  // Cleanup on unmount or engine change
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      clearSimulation();
    };
  }, [clearSimulation]);

  // Stop listening when engine changes
  useEffect(() => {
    if (isListening) {
      stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asrEngine]);

  return {
    isListening,
    isSupported,
    error,
    detectedLanguage,
    processingStatus,
    startListening,
    stopListening,
    toggleListening,
    clearError,
  };
}
