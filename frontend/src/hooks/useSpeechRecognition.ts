import { useState, useRef, useCallback, useEffect } from 'react';

// Browser compatibility types
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
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  error: SpeechRecognitionError;
  /** The language code detected by the browser's speech engine (if available), null otherwise */
  detectedLanguage: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  clearError: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { onInterimResult, onFinalResult, lang = 'auto' } = options;

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<SpeechRecognitionError>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('not-supported');
      return;
    }

    // Clean up any existing instance
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

    // Only set lang when a specific language is chosen (not 'auto')
    if (lang && lang !== 'auto') {
      recognition.lang = lang;
    }
    // When 'auto', leave recognition.lang at browser default (empty string or browser locale)

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;

          // Try to extract detected language from the result if available
          // Some browsers expose this via non-standard properties
          const resultAny = result as unknown as Record<string, unknown>;
          const detectedLang =
            (resultAny['language'] as string | undefined) ||
            (result[0] as unknown as Record<string, unknown>)['language'] as string | undefined;

          if (detectedLang && typeof detectedLang === 'string') {
            setDetectedLanguage(detectedLang);
          }
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript && onInterimResult) {
        onInterimResult(interimTranscript);
      }
      if (finalTranscript && onFinalResult) {
        onFinalResult(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          setError('permission-denied');
          break;
        case 'no-speech':
          setError('no-speech');
          break;
        case 'audio-capture':
          setError('audio-capture');
          break;
        case 'network':
          setError('network');
          break;
        default:
          setError('unknown');
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError('unknown');
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [isSupported, lang, onInterimResult, onFinalResult]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Clear detected language when switching away from auto-detect
  useEffect(() => {
    if (lang !== 'auto') {
      setDetectedLanguage(null);
    }
  }, [lang]);

  return {
    isListening,
    isSupported,
    error,
    detectedLanguage,
    startListening,
    stopListening,
    toggleListening,
    clearError,
  };
}
