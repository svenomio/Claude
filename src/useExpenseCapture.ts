import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, ensureDefaultCategories } from "./db/db";
import { useSpeechRecognition } from "./voice/useSpeechRecognition";
import { parseExpenses, type ParsedExpense } from "./voice/parser";

const SAVED_BANNER_MS = 5000;

/** Shared voice-capture-and-save logic used by both the full app and the quick-capture screen. */
export function useExpenseCapture() {
  const [lastSaved, setLastSaved] = useState<ParsedExpense[] | null>(null);

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    start,
    stop,
    reset,
    error,
    possiblyTruncated,
  } = useSpeechRecognition("de-DE");

  useEffect(() => {
    ensureDefaultCategories();
  }, []);

  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];

  useEffect(() => {
    if (!lastSaved) return;
    const timer = setTimeout(() => setLastSaved(null), SAVED_BANNER_MS);
    return () => clearTimeout(timer);
  }, [lastSaved]);

  const saveExpenses = async (items: ParsedExpense[], rawTranscript?: string) => {
    const validItems = items.filter((item) => item.amount !== null && item.amount > 0);
    if (validItems.length === 0) return;
    await db.expenses.bulkAdd(
      validItems.map((item) => ({
        amount: item.amount as number,
        description: item.description,
        category: item.category,
        date: new Date().toISOString(),
        rawTranscript,
      })) as never,
    );
    setLastSaved(validItems);
  };

  useEffect(() => {
    if (!isListening && transcript && categories.length > 0) {
      const items = parseExpenses(transcript, categories);
      saveExpenses(items, transcript);
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript, categories, reset]);

  const submitManualText = (text: string) => {
    if (!text.trim() || categories.length === 0) return;
    const items = parseExpenses(text.trim(), categories);
    saveExpenses(items, text.trim());
  };

  return {
    isSupported,
    isListening,
    interimTranscript,
    error,
    possiblyTruncated,
    start,
    stop,
    lastSaved,
    categories,
    submitManualText,
  };
}
