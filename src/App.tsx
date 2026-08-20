import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, currentMonth } from "./db/db";
import { useExpenseCapture } from "./useExpenseCapture";
import { MicButton } from "./components/MicButton";
import { BudgetOverview } from "./components/BudgetOverview";
import { ExpenseList } from "./components/ExpenseList";

function App() {
  const [manualText, setManualText] = useState("");

  const {
    isSupported,
    isListening,
    interimTranscript,
    error,
    start,
    stop,
    lastSaved,
    categories,
    submitManualText,
  } = useExpenseCapture();

  const month = currentMonth();

  const expenses = useLiveQuery(
    () => db.expenses.where("date").startsWith(month).reverse().sortBy("date"),
    [month],
  ) ?? [];

  const budget = useLiveQuery(() => db.budgets.where("month").equals(month).first(), [month]);

  const spent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const handleManualSubmit = () => {
    submitManualText(manualText);
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

      {lastSaved && (
        <div className="w-full rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            {lastSaved.length > 1 ? `${lastSaved.length} Posten gespeichert:` : "Gespeichert:"}
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {lastSaved.map((item, i) => (
              <li key={i} className="text-sm text-green-700">
                {item.description} · {item.category} · {item.amount?.toFixed(2)} €
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-green-600">
            Falsch erkannt? In der Liste unten kannst du jeden Posten nachträglich bearbeiten.
          </p>
        </div>
      )}

      {!isSupported && (
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
          onUpdate={(id, patch) => db.expenses.update(id, patch)}
        />
      </section>
    </div>
  );
}

export default App;
