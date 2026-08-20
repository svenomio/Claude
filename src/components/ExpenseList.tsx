import { useState } from "react";
import type { Expense, Category } from "../db/db";

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, patch: { amount: number; description: string; category: string }) => void;
}

export function ExpenseList({ expenses, categories, onDelete, onUpdate }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const iconFor = (name: string) => categories.find((c) => c.name === name)?.icon ?? "📦";

  if (expenses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Noch keine Ausgaben erfasst. Sag einfach z. B. "Kaffee drei Euro fünfzig".
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-200">
      {expenses.map((e) =>
        editingId === e.id ? (
          <EditRow
            key={e.id}
            expense={e}
            categories={categories}
            onCancel={() => setEditingId(null)}
            onSave={(patch) => {
              onUpdate(e.id, patch);
              setEditingId(null);
            }}
          />
        ) : (
          <li key={e.id} className="flex items-center justify-between gap-3 py-3">
            <button
              onClick={() => setEditingId(e.id)}
              className="flex flex-1 items-center gap-3 overflow-hidden text-left"
            >
              <span className="text-xl">{iconFor(e.category)}</span>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-zinc-900">{e.description}</p>
                <p className="text-xs text-zinc-500">
                  {e.category} · {new Date(e.date).toLocaleDateString("de-DE")}
                </p>
                {e.rawTranscript && (
                  <p className="break-words text-xs italic text-zinc-400">"{e.rawTranscript}"</p>
                )}
              </div>
            </button>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900">{e.amount.toFixed(2)} €</span>
              <button
                onClick={() => onDelete(e.id)}
                aria-label="Ausgabe löschen"
                className="text-zinc-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </li>
        ),
      )}
    </ul>
  );
}

interface EditRowProps {
  expense: Expense;
  categories: Category[];
  onSave: (patch: { amount: number; description: string; category: string }) => void;
  onCancel: () => void;
}

function EditRow({ expense, categories, onSave, onCancel }: EditRowProps) {
  const [amount, setAmount] = useState(expense.amount.toString());
  const [description, setDescription] = useState(expense.description);
  const [category, setCategory] = useState(expense.category);

  const parsedAmount = parseFloat(amount.replace(",", "."));
  const canSave = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  return (
    <li className="py-3">
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-violet-500"
          />
          <span className="text-sm text-zinc-500">€</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-violet-500"
        >
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <div className="mt-2 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-zinc-100 py-1.5 text-sm text-zinc-600 hover:bg-zinc-200"
          >
            Abbrechen
          </button>
          <button
            disabled={!canSave}
            onClick={() => onSave({ amount: parsedAmount, description, category })}
            className="flex-1 rounded-lg bg-violet-600 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Speichern
          </button>
        </div>
      </div>
    </li>
  );
}
