import Dexie, { type EntityTable } from "dexie";

export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO date, e.g. 2026-08-20
  rawTranscript?: string;
}

export interface Category {
  name: string;
  keywords: string[];
  icon: string;
}

export interface Budget {
  id: number;
  month: string; // YYYY-MM
  limit: number;
}

export const db = new Dexie("sparcity-voice") as Dexie & {
  expenses: EntityTable<Expense, "id">;
  categories: EntityTable<Category, "name">;
  budgets: EntityTable<Budget, "id">;
};

db.version(1).stores({
  expenses: "++id, category, date",
  categories: "name",
  budgets: "++id, month",
});

export const DEFAULT_CATEGORIES: Category[] = [
  { name: "Lebensmittel", keywords: ["essen", "lebensmittel", "supermarkt", "einkauf", "einkaufen"], icon: "🛒" },
  { name: "Café & Restaurant", keywords: ["kaffee", "café", "restaurant", "mittagessen", "essen gehen"], icon: "☕" },
  { name: "Transport", keywords: ["bahn", "bus", "taxi", "tanken", "benzin", "ticket", "parken"], icon: "🚗" },
  { name: "Freizeit", keywords: ["kino", "konzert", "freizeit", "hobby", "sport"], icon: "🎉" },
  { name: "Shopping", keywords: ["kleidung", "shopping", "amazon", "klamotten"], icon: "🛍️" },
  { name: "Gesundheit", keywords: ["apotheke", "arzt", "medikament", "gesundheit"], icon: "💊" },
  { name: "Wohnen", keywords: ["miete", "strom", "gas", "internet", "wohnen"], icon: "🏠" },
  { name: "Sonstiges", keywords: [], icon: "📦" },
];

export async function ensureDefaultCategories() {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);
  }
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
