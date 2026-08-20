import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

// Wie lange nach der letzten erkannten Sprache gewartet wird, bevor die
// Aufnahme automatisch beendet wird. Der Browser selbst reagiert auf kurze
// Pausen viel zu empfindlich, deshalb übernehmen wir das Timing hier.
const SILENCE_TIMEOUT_MS = 3500;

export function useSpeechRecognition(lang = "de-DE"): UseSpeechRecognitionResult {
  const Ctor = getRecognitionCtor();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer]);

  useEffect(() => {
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      armSilenceTimer();
      // Rebuild the final transcript from the full results list every time
      // instead of appending only the "new" range indicated by resultIndex.
      // In continuous mode, some browsers re-emit already-finalized results
      // with an unreliable resultIndex, which would otherwise duplicate text.
      // On top of that, some engines (observed on Android Chrome) restart
      // recognition internally and re-finalize the exact same phrase as a
      // brand-new result entry — so we also drop back-to-back final chunks
      // that are identical to the one right before them.
      let finalText = "";
      let interimText = "";
      let lastFinal = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const chunk = result[0].transcript.trim();
          if (chunk && chunk.toLowerCase() !== lastFinal.toLowerCase()) {
            finalText += (finalText ? " " : "") + chunk;
            lastFinal = chunk;
          }
        } else {
          interimText += result[0].transcript;
        }
      }
      if (finalText) setTranscript(finalText.trim());
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearSilenceTimer();
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    return () => {
      clearSilenceTimer();
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [Ctor, lang, armSilenceTimer, clearSilenceTimer]);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    try {
      recognitionRef.current.start();
      setIsListening(true);
      armSilenceTimer();
    } catch {
      // start() throws if already started; ignore
    }
  }, [isListening, armSilenceTimer]);

  const stop = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [clearSilenceTimer]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    isSupported: Ctor !== null,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  };
}
