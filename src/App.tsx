import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, ensureDefaultCategories, currentMonth } from "./db/db";
import { useSpeechRecognition } from "./voice/useSpeechRecognition";
import { parseExpenses, type ParsedExpense } from "./voice/parser";
import { MicButton } from "./components/MicButton";
import { BudgetOverview } from "./components/BudgetOverview";
import { ExpenseList } from "./components/ExpenseList";
import { ExpenseDraftCard } from "./components/ExpenseDraftCard";

function App() {
  const [draft, setDraft] = useState<{ items: ParsedExpense[]; transcript: string } | null>(null);
  const [manualText, setManualText] = useState("");

  const { isSupported, isListening, transcript, interimTranscript, start, stop, reset, error } =
    useSpeechRecognition("de-DE");

  useEffect(() => {
    ensureDefaultCategories();
  }, []);

  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const month = currentMonth();

  const expenses = useLiveQuery(
    () => db.expenses.where("date").startsWith(month).reverse().sortBy("date"),
    [month],
  ) ?? [];

  const budget = useLiveQuery(() => db.budgets.where("month").equals(month).first(), [month]);

  const spent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  useEffect(() => {
    if (!isListening && transcript && categories.length > 0) {
      const items = parseExpenses(transcript, categories);
      setDraft({ items, transcript });
      reset();
    }
  }, [isListening, transcript, categories, reset]);

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
    setDraft(null);
  };

  const handleManualSubmit = () => {
    if (!manualText.trim() || categories.length === 0) return;
    const items = parseExpenses(manualText.trim(), categories);
    setDraft({ items, transcript: manualText.trim() });
    setManualText("");
  };

  const setBudgetLimit = async (limit: number) => {
    if (budget) {
      await db.budgets.update(budget.id, { limit });
    } else {
      await db.budgets.add({ month, limit } as never);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 pb-10 pt-8 text-zinc-900">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">💜 Sparcity Voice</h1>
        <p className="mt-1 text-sm text-zinc-500">Sag deine Ausgabe, wir tracken den Rest.</p>
      </header>

      <BudgetOverview spent={spent} limit={budget?.limit ?? null} onSetLimit={setBudgetLimit} />

      <div className="flex flex-col items-center gap-3">
        <MicButton
          isListening={isListening}
          isSupported={isSupported}
          onClick={() => (isListening ? stop() : start())}
        />
        {interimTranscript && (
          <p className="max-w-full truncate text-sm italic text-zinc-500">"{interimTranscript}"</p>
        )}
        {error && <p className="text-xs text-red-500">Fehler: {error}</p>}
      </div>

      {draft && (
        <ExpenseDraftCard
          items={draft.items}
          transcript={draft.transcript}
          categories={categories}
          onConfirm={(items) => saveExpenses(items, draft.transcript)}
          onDiscard={() => setDraft(null)}
        />
      )}

      {!isSupported && !draft && (
        <div className="flex gap-2">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            placeholder='z. B. "Kaffee 3,50 Euro"'
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={handleManualSubmit}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            OK
          </button>
        </div>
      )}

      <section className="flex-1">
        <h2 className="mb-1 text-sm font-medium text-zinc-400">Letzte Ausgaben</h2>
        <ExpenseList
          expenses={expenses}
          categories={categories}
          onDelete={(id) => db.expenses.delete(id)}
        />
      </section>
    </div>
  );
}

export default App;
