import { useState } from "react";
import type { Category } from "../db/db";
import type { ParsedExpense } from "../voice/parser";

interface ExpenseDraftCardProps {
  draft: ParsedExpense;
  transcript: string;
  categories: Category[];
  onConfirm: (draft: ParsedExpense) => void;
  onDiscard: () => void;
}

export function ExpenseDraftCard({ draft, transcript, categories, onConfirm, onDiscard }: ExpenseDraftCardProps) {
  const [amount, setAmount] = useState(draft.amount?.toString() ?? "");
  const [description, setDescription] = useState(draft.description);
  const [category, setCategory] = useState(draft.category);

  const parsedAmount = parseFloat(amount.replace(",", "."));
  const canConfirm = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  return (
    <div className="w-full rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">Gehört: "{transcript}"</p>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Betrag"
          className="w-28 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-lg font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-violet-500"
        />
        <span className="text-lg text-zinc-500">€</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung"
          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="mt-3 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-violet-500"
      >
        {categories.map((c) => (
          <option key={c.name} value={c.name}>
            {c.icon} {c.name}
          </option>
        ))}
      </select>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onDiscard}
          className="flex-1 rounded-lg bg-zinc-100 py-2 text-sm text-zinc-600 hover:bg-zinc-200"
        >
          Verwerfen
        </button>
        <button
          disabled={!canConfirm}
          onClick={() => onConfirm({ amount: parsedAmount, description, category })}
          className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Speichern
        </button>
      </div>
    </div>
  );
}
