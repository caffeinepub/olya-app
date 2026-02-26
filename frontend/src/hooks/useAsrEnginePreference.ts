import { useState, useCallback } from 'react';

export type AsrEngine = 'webSpeech' | 'whisper' | 'deepspeech';

const STORAGE_KEY = 'olya-asr-engine';
const DEFAULT_ENGINE: AsrEngine = 'webSpeech';

function readFromStorage(): AsrEngine {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'webSpeech' || stored === 'whisper' || stored === 'deepspeech') {
      return stored;
    }
  } catch {
    // ignore
  }
  return DEFAULT_ENGINE;
}

export function useAsrEnginePreference() {
  const [asrEngine, setAsrEngineState] = useState<AsrEngine>(readFromStorage);

  const setAsrEngine = useCallback((engine: AsrEngine) => {
    try {
      localStorage.setItem(STORAGE_KEY, engine);
    } catch {
      // ignore
    }
    setAsrEngineState(engine);
  }, []);

  const getAsrEngine = useCallback((): AsrEngine => {
    return readFromStorage();
  }, []);

  return { asrEngine, setAsrEngine, getAsrEngine };
}
