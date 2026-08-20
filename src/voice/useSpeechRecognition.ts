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
  // True when the recognition ended while there was still unfinalized
  // speech pending — a sign Chrome's own pause detection cut the user off
  // mid-sentence rather than them finishing naturally.
  possiblyTruncated: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Thin, deliberately simple wrapper around the Web Speech API.
 *
 * History note: earlier versions tried to stitch multiple recognition
 * rounds together in the background (continuous:true, then a manual
 * restart-on-unexpected-end scheme) to avoid cutting the user off on
 * short pauses. On real Android hardware that turned out to be
 * unreliable in two different ways — sometimes the engine re-transcribed
 * the same audio into duplicate-but-different entries, and sometimes a
 * background restart silently failed, leaving the UI stuck on
 * "listening" while nothing was actually being captured. Both failure
 * modes are worse than the original "stops a bit eagerly" complaint, so
 * this version does exactly one thing: one tap starts exactly one
 * recognition round, and whatever Chrome finalizes when it ends (by
 * itself, or via stop()) is the result. No hidden restarts.
 */
export function useSpeechRecognition(lang = "de-DE"): UseSpeechRecognitionResult {
  const Ctor = getRecognitionCtor();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [possiblyTruncated, setPossiblyTruncated] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pendingInterimRef = useRef("");

  useEffect(() => {
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Rebuild from the full results list every time instead of only the
      // "new" range resultIndex points at, and skip a final chunk that's
      // identical to the one right before it — some engines re-report
      // already-finalized text with an unreliable resultIndex.
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
      pendingInterimRef.current = interimText;
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setPossiblyTruncated(pendingInterimRef.current.trim().length > 0);
      pendingInterimRef.current = "";
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [Ctor, lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setPossiblyTruncated(false);
    pendingInterimRef.current = "";
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // start() throws if already started; ignore
    }
  }, [isListening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

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
    possiblyTruncated,
    start,
    stop,
    reset,
  };
}
