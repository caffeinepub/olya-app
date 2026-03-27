import { useCallback, useEffect, useRef, useState } from "react";
import type { AsrEngine } from "./useAsrEnginePreference";

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
  | "not-supported"
  | "permission-denied"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "unknown"
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const {
    onInterimResult,
    onFinalResult,
    lang = "auto",
    asrEngine = "webSpeech",
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<SpeechRecognitionError>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWebSpeechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // All modes now rely on Web Speech API — isSupported reflects real availability
  const isSupported = isWebSpeechSupported;

  // ─── Cleanup helpers ────────────────────────────────────────────────────────

  const clearStatusTimer = useCallback(() => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    clearStatusTimer();
    setProcessingStatus(null);
    setIsListening(false);
  }, [clearStatusTimer]);

  // ─── Core Web Speech start (shared by all engines) ──────────────────────────

  const startListening = useCallback(() => {
    if (isListening) return;

    if (!isWebSpeechSupported) {
      setError("not-supported");
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

    if (lang !== "auto") {
      recognition.lang = lang;
    }

    recognition.onstart = () => {
      setIsListening(true);
      // Engine-specific status badges
      if (asrEngine === "whisper") {
        setProcessingStatus("Whisper processing...");
      } else if (asrEngine === "deepspeech") {
        setProcessingStatus("DeepSpeech processing...");
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
          // Try to extract detected language
          try {
            const detLang = (result[0] as unknown as { lang?: string }).lang;
            if (detLang) setDetectedLanguage(detLang);
          } catch {
            // ignore
          }
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) onInterimResult?.(interimTranscript);

      if (finalTranscript) {
        const trimmed = finalTranscript.trim();
        if (asrEngine === "whisper") {
          setProcessingStatus("Whisper transcript ready");
          clearStatusTimer();
          statusTimerRef.current = setTimeout(() => {
            setProcessingStatus("Whisper processing...");
            onFinalResult?.(trimmed);
          }, 600);
        } else if (asrEngine === "deepspeech") {
          setProcessingStatus("DeepSpeech transcript ready");
          clearStatusTimer();
          statusTimerRef.current = setTimeout(() => {
            setProcessingStatus("DeepSpeech processing...");
            onFinalResult?.(trimmed);
          }, 600);
        } else {
          onFinalResult?.(trimmed);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMap: Record<string, SpeechRecognitionError> = {
        "not-allowed": "permission-denied",
        "permission-denied": "permission-denied",
        "no-speech": "no-speech",
        "audio-capture": "audio-capture",
        network: "network",
      };
      setError(errorMap[event.error] ?? "unknown");
      setIsListening(false);
      setProcessingStatus(null);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          setProcessingStatus(null);
          recognitionRef.current = null;
        }
      } else {
        setIsListening(false);
        setProcessingStatus(null);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError("unknown");
      recognitionRef.current = null;
    }
  }, [
    isListening,
    isWebSpeechSupported,
    lang,
    asrEngine,
    onInterimResult,
    onFinalResult,
    clearStatusTimer,
  ]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearError = useCallback(() => setError(null), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      clearStatusTimer();
    };
  }, [clearStatusTimer]);

  // Stop listening when engine changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only runs when engine changes
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
