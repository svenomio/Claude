import type { Expense, Category } from "../db/db";

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  onDelete: (id: number) => void;
}

export function ExpenseList({ expenses, categories, onDelete }: ExpenseListProps) {
  const iconFor = (name: string) => categories.find((c) => c.name === name)?.icon ?? "📦";

  if (expenses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Noch keine Ausgaben erfasst. Sag einfach z. B. "Kaffee drei Euro fünfzig".
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-800">
      {expenses.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-xl">{iconFor(e.category)}</span>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-zinc-100">{e.description}</p>
              <p className="text-xs text-zinc-500">
                {e.category} · {new Date(e.date).toLocaleDateString("de-DE")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">{e.amount.toFixed(2)} €</span>
            <button
              onClick={() => onDelete(e.id)}
              aria-label="Ausgabe löschen"
              className="text-zinc-600 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
