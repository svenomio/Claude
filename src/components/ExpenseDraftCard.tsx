import { useState } from "react";
import type { Category } from "../db/db";
import type { ParsedExpense } from "../voice/parser";

interface DraftRow extends ParsedExpense {
  key: number;
}

interface ExpenseDraftCardProps {
  items: ParsedExpense[];
  transcript: string;
  categories: Category[];
  onConfirm: (items: ParsedExpense[]) => void;
  onDiscard: () => void;
}

export function ExpenseDraftCard({ items, transcript, categories, onConfirm, onDiscard }: ExpenseDraftCardProps) {
  const [rows, setRows] = useState<DraftRow[]>(items.map((item, i) => ({ ...item, key: i })));

  const updateRow = (key: number, patch: Partial<ParsedExpense>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRow = (key: number) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const validRows = rows.filter((r) => r.amount !== null && r.amount > 0);
  const canConfirm = validRows.length > 0;
  const total = validRows.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <div className="w-full rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">Gehört: "{transcript}"</p>

      <div className="mt-3 flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.key} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={row.amount ?? ""}
                onChange={(e) =>
                  updateRow(row.key, {
                    amount: e.target.value === "" ? null : parseFloat(e.target.value),
                  })
                }
                placeholder="Betrag"
                className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-base font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-violet-500"
              />
              <span className="text-sm text-zinc-500">€</span>
              <input
                type="text"
                value={row.description}
                onChange={(e) => updateRow(row.key, { description: e.target.value })}
                placeholder="Beschreibung"
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={() => removeRow(row.key)}
                aria-label="Position entfernen"
                className="shrink-0 text-zinc-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
            <select
              value={row.category}
              onChange={(e) => updateRow(row.key, { category: e.target.value })}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-violet-500"
            >
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="py-2 text-center text-sm text-zinc-500">Keine Positionen mehr.</p>
        )}
      </div>

      {rows.length > 1 && (
        <p className="mt-3 text-right text-sm text-zinc-500">
          Gesamt: <span className="font-semibold text-zinc-900">{total.toFixed(2)} €</span>
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onDiscard}
          className="flex-1 rounded-lg bg-zinc-100 py-2 text-sm text-zinc-600 hover:bg-zinc-200"
        >
          Verwerfen
        </button>
        <button
          disabled={!canConfirm}
          onClick={() => onConfirm(validRows.map(({ key: _key, ...rest }) => rest))}
          className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {rows.length > 1 ? `${validRows.length} Posten speichern` : "Speichern"}
        </button>
      </div>
    </div>
  );
}
