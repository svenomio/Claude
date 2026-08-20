interface BudgetOverviewProps {
  spent: number;
  limit: number | null;
  onSetLimit: (limit: number) => void;
}

export function BudgetOverview({ spent, limit, onSetLimit }: BudgetOverviewProps) {
  const pct = limit && limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = limit !== null && spent > limit;

  return (
    <div className="w-full rounded-2xl bg-zinc-900 p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-zinc-400">Diesen Monat ausgegeben</span>
        {limit === null ? (
          <button
            onClick={() => {
              const value = window.prompt("Monatsbudget in Euro festlegen:");
              const num = value ? parseFloat(value.replace(",", ".")) : NaN;
              if (!Number.isNaN(num) && num > 0) onSetLimit(num);
            }}
            className="text-xs text-violet-400 hover:text-violet-300"
          >
            Budget festlegen
          </button>
        ) : (
          <button
            onClick={() => {
              const value = window.prompt("Monatsbudget anpassen:", String(limit));
              const num = value ? parseFloat(value.replace(",", ".")) : NaN;
              if (!Number.isNaN(num) && num > 0) onSetLimit(num);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Bearbeiten
          </button>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-zinc-50">{spent.toFixed(2)} €</span>
        {limit !== null && (
          <span className="text-sm text-zinc-500">von {limit.toFixed(2)} €</span>
        )}
      </div>

      {limit !== null && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-violet-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {over && (
        <p className="mt-2 text-xs text-red-400">
          Budget um {(spent - limit!).toFixed(2)} € überschritten
        </p>
      )}
    </div>
  );
}
