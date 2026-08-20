interface MicButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
}

export function MicButton({ isListening, isSupported, onClick }: MicButtonProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        disabled={!isSupported}
        aria-label={isListening ? "Aufnahme stoppen" : "Ausgabe per Sprache erfassen"}
        className={[
          "relative flex h-28 w-28 items-center justify-center rounded-full text-4xl transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-40",
          isListening
            ? "bg-violet-500 shadow-[0_0_0_12px_rgba(124,58,237,0.25)] scale-105"
            : "bg-violet-600 hover:bg-violet-500 active:scale-95 shadow-lg shadow-violet-950/50",
        ].join(" ")}
      >
        {isListening && (
          <span className="absolute inset-0 animate-ping rounded-full bg-violet-500/40" />
        )}
        <span className="relative">{isListening ? "⏹" : "🎤"}</span>
      </button>
      <p className="text-sm text-zinc-400">
        {!isSupported
          ? "Spracherkennung nicht unterstützt – nutze die manuelle Eingabe"
          : isListening
            ? "Ich höre zu…"
            : "Tippen und Ausgabe sagen"}
      </p>
    </div>
  );
}
