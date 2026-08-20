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
// Aufnahme wirklich als beendet gilt. Chrome selbst beendet jede einzelne
// Erkennungs-Runde schon nach einer kurzen Pause (das ist gewollt, siehe
// unten), aber jede solche Runde wird bis zu diesem Timeout automatisch
// im Hintergrund neu gestartet – erst danach ist der Nutzer wirklich fertig.
const SILENCE_TIMEOUT_MS = 3500;

// Fehler, bei denen ein Neustart aussichtslos ist (Berechtigung verweigert,
// kein Mikrofon, Dienst blockiert). Alles andere (z. B. "no-speech",
// "network") behandeln wir als vorübergehenden Ausrutscher und starten
// die Erkennung im Hintergrund neu, ohne den Nutzer zu unterbrechen.
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);

function dedupeAdjacentFinal(results: SpeechRecognitionResultList): { finalText: string; interimText: string } {
  let finalText = "";
  let interimText = "";
  let lastFinal = "";
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
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
  return { finalText, interimText };
}

export function useSpeechRecognition(lang = "de-DE"): UseSpeechRecognitionResult {
  const Ctor = getRecognitionCtor();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Android (und teils andere Browser) beenden die Erkennung im
  // continuous-Modus gelegentlich unaufgefordert mitten im Diktat (interner
  // Neustart, kurzer "no-speech"-Ausrutscher, ...). Wir unterscheiden das
  // von einem echten, gewollten Stopp und starten im ersten Fall still neu,
  // statt das bisher Gesagte als "fertig" zu behandeln und zu speichern.
  const intentionalStopRef = useRef(false);
  // Bereits abgeschlossene Teil-Sessions dieses einen Diktier-Vorgangs
  // (vor einem stillen Neustart), damit beim Neustart nichts verloren geht.
  const committedTranscriptRef = useRef("");
  const lastSessionFinalRef = useRef("");

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      intentionalStopRef.current = true;
      recognitionRef.current?.stop();
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer]);

  useEffect(() => {
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = lang;
    // continuous:true turned out to be unreliable on Android: the engine
    // restarts internally mid-utterance and sometimes re-transcribes the
    // same audio with different wording, producing duplicate-but-different
    // entries no exact-match dedupe can catch. continuous:false gives one
    // clean, complete, independent recognition pass per Chrome-detected
    // pause; the restart/merge logic below stitches those passes back into
    // one seamless transcript, so pauses still don't cut the dictation off.
    recognition.continuous = false;
    recognition.interimResults = true;

    const attemptRestart = () => {
      try {
        recognition.start();
        armSilenceTimer();
      } catch {
        // Manche Browser lehnen einen sofortigen Neustart kurz nach dem
        // Ende ab; ein zweiter Versuch kurz danach behebt das meist.
        setTimeout(() => {
          try {
            recognition.start();
            armSilenceTimer();
          } catch {
            setIsListening(false);
            setInterimTranscript("");
          }
        }, 250);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      armSilenceTimer();
      // Aus der aktuellen results-Liste neu aufbauen statt anzuhängen: manche
      // Browser melden bereits finalen Text erneut mit unzuverlässigem
      // resultIndex, außerdem werden direkt aufeinanderfolgende identische
      // Textstücke (Engine-Wiederholung) verworfen.
      const { finalText, interimText } = dedupeAdjacentFinal(event.results);
      lastSessionFinalRef.current = finalText;
      const combined = [committedTranscriptRef.current, finalText].filter(Boolean).join(" ");
      if (combined) setTranscript(combined);
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (FATAL_ERRORS.has(event.error)) {
        intentionalStopRef.current = true;
        setError(event.error);
      }
      // Bei allem anderen: nichts tun, onend entscheidet gleich anschließend
      // ob still neu gestartet wird.
    };

    recognition.onend = () => {
      if (intentionalStopRef.current) {
        intentionalStopRef.current = false;
        clearSilenceTimer();
        setIsListening(false);
        setInterimTranscript("");
        return;
      }
      // Unerwartetes Ende, obwohl weder Nutzer noch Silence-Timer das
      // wollten – bisher Erkanntes sichern und im Hintergrund weiterhören.
      committedTranscriptRef.current = [committedTranscriptRef.current, lastSessionFinalRef.current]
        .filter(Boolean)
        .join(" ");
      lastSessionFinalRef.current = "";
      attemptRestart();
    };

    recognitionRef.current = recognition;
    return () => {
      intentionalStopRef.current = true;
      clearSilenceTimer();
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [Ctor, lang, armSilenceTimer, clearSilenceTimer]);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    intentionalStopRef.current = false;
    committedTranscriptRef.current = "";
    lastSessionFinalRef.current = "";
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
    intentionalStopRef.current = true;
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
