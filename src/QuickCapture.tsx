import { useExpenseCapture } from "./useExpenseCapture";

/**
 * Minimal, dashboard-free capture screen meant to be opened via a pinned
 * home-screen shortcut — no budget overview, no list, just the mic.
 *
 * This used to auto-start listening on load so a single tap on the home
 * screen icon would be enough. That silently failed in practice: browsers
 * only allow microphone access to start from a genuine user gesture (a
 * click/tap) within the page itself, and simply opening a page (even via a
 * pinned shortcut) doesn't count as one. So this still needs one tap on
 * the mic after opening — just without any dashboard in the way first.
 */
export function QuickCapture() {
  const { isSupported, isListening, interimTranscript, error, possiblyTruncated, start, stop, lastSaved } =
    useExpenseCapture();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center text-zinc-900">
      <button
        onClick={() => (isListening ? stop() : start())}
        disabled={!isSupported}
        aria-label={isListening ? "Aufnahme stoppen" : "Erneut aufnehmen"}
        className={[
          "relative flex h-32 w-32 items-center justify-center rounded-full text-5xl transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-40",
          isListening
            ? "bg-violet-500 shadow-[0_0_0_14px_rgba(124,58,237,0.25)] scale-105"
            : "bg-violet-600 active:scale-95 shadow-lg shadow-violet-600/30",
        ].join(" ")}
      >
        {isListening && <span className="absolute inset-0 animate-ping rounded-full bg-violet-500/40" />}
        <span className="relative">{isListening ? "⏹" : "🎤"}</span>
      </button>

      <p className="text-sm text-zinc-500">
        {!isSupported
          ? "Spracherkennung wird von diesem Browser nicht unterstützt."
          : isListening
            ? "Ich höre zu…"
            : "Antippen zum Diktieren"}
      </p>

      {interimTranscript && (
        <p className="max-w-full truncate text-sm italic text-zinc-500">"{interimTranscript}"</p>
      )}
      {error && <p className="text-xs text-red-500">Fehler: {error}</p>}

      {possiblyTruncated && (
        <p className="max-w-sm rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          ⚠️ Die Aufnahme wurde möglicherweise mitten im Satz beendet. Bei langen Sätzen lieber
          kurz antippen und in kleineren Portionen diktieren.
        </p>
      )}

      {lastSaved && (
        <div className="w-full max-w-sm rounded-2xl border border-green-200 bg-green-50 p-4 text-left">
          <p className="text-sm font-medium text-green-800">
            {lastSaved.length > 1 ? `${lastSaved.length} Posten gespeichert` : "Gespeichert"}
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {lastSaved.map((item, i) => (
              <li key={i} className="text-sm text-green-700">
                {item.description} · {item.category} · {item.amount?.toFixed(2)} €
              </li>
            ))}
          </ul>
        </div>
      )}

      <a href="." className="mt-2 text-xs text-zinc-400 underline underline-offset-2">
        Zur vollständigen App
      </a>
    </div>
  );
}
