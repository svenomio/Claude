import type { Category } from "../db/db";

export interface ParsedExpense {
  amount: number | null;
  category: string;
  description: string;
}

const UNITS: Record<string, number> = {
  null: 0, ein: 1, eine: 1, einen: 1, eins: 1, zwei: 2, drei: 3, vier: 4,
  fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11,
  zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16,
  siebzehn: 17, achtzehn: 18, neunzehn: 19,
};

const TENS: Record<string, number> = {
  zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, sechzig: 60,
  siebzig: 70, achtzig: 80, neunzig: 90,
};

function wordToNumber(word: string): number | null {
  const w = word.toLowerCase();
  if (w in UNITS) return UNITS[w];
  if (w in TENS) return TENS[w];
  const undMatch = w.match(/^(ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)$/);
  if (undMatch) {
    const unit = UNITS[undMatch[1] === "ein" ? "eins" : undMatch[1]];
    const ten = TENS[undMatch[2]];
    return ten + unit;
  }
  return null;
}

function extractNumberToken(text: string, startIndex: number): { value: number; endIndex: number } | null {
  const digitMatch = text.slice(startIndex).match(/^\s*(\d+)(?:[.,](\d{1,2}))?/);
  if (digitMatch) {
    const whole = parseInt(digitMatch[1], 10);
    const frac = digitMatch[2] ? parseInt(digitMatch[2].padEnd(2, "0"), 10) / 100 : 0;
    return { value: whole + frac, endIndex: startIndex + digitMatch[0].length };
  }
  const wordMatch = text.slice(startIndex).match(/^\s*([a-zäöüß]+)/i);
  if (wordMatch) {
    const num = wordToNumber(wordMatch[1]);
    if (num !== null) {
      return { value: num, endIndex: startIndex + wordMatch[0].length };
    }
  }
  return null;
}

/**
 * Parses German amount phrases such as:
 *  "3,50 Euro", "17 Euro", "50 Cent", "drei Euro fünfzig",
 *  "zwei Euro", "17,50", "5 Euro 20 Cent"
 */
function extractAmount(text: string): { amount: number | null; matchedSpan: [number, number] | null } {
  const lower = text.toLowerCase();

  const eurosThenCents = /(\d+(?:[.,]\d{1,2})?|[a-zäöüß]+)\s*(?:euro|€)\s*(?:und\s*)?(\d+|[a-zäöüß]+)?\s*(?:cent)?/i;
  const match = lower.match(eurosThenCents);
  if (match) {
    const startIdx = match.index ?? 0;
    const euroTok = extractNumberToken(lower, startIdx);
    if (euroTok) {
      let amount = euroTok.value;
      const afterEuro = lower.slice(euroTok.endIndex).match(/^\s*euro\s*(?:und\s*)?/i);
      if (afterEuro) {
        const centStart = euroTok.endIndex + afterEuro[0].length;
        const centTok = extractNumberToken(lower, centStart);
        if (centTok && Number.isInteger(amount)) {
          const isCentContext = lower.slice(centTok.endIndex).match(/^\s*cent/i);
          if (isCentContext || centTok.value < 100) {
            amount = amount + (centTok.value >= 1 ? centTok.value / 100 : 0);
          }
        }
        const endIndex = centTok
          ? centTok.endIndex + (lower.slice(centTok.endIndex).match(/^\s*cent/i)?.[0].length ?? 0)
          : euroTok.endIndex + afterEuro[0].length;
        return { amount, matchedSpan: [startIdx, endIndex] };
      }
      return { amount, matchedSpan: [startIdx, euroTok.endIndex] };
    }
  }

  const centOnly = lower.match(/(\d+|[a-zäöüß]+)\s*cent/i);
  if (centOnly) {
    const startIdx = centOnly.index ?? 0;
    const tok = extractNumberToken(lower, startIdx);
    if (tok) {
      const endIndex = tok.endIndex + (lower.slice(tok.endIndex).match(/^\s*cent/i)?.[0].length ?? 0);
      return { amount: tok.value / 100, matchedSpan: [startIdx, endIndex] };
    }
  }

  const bareNumber = lower.match(/\d+(?:[.,]\d{1,2})?/);
  if (bareNumber) {
    const startIdx = bareNumber.index ?? 0;
    return {
      amount: parseFloat(bareNumber[0].replace(",", ".")),
      matchedSpan: [startIdx, startIdx + bareNumber[0].length],
    };
  }

  return { amount: null, matchedSpan: null };
}

function guessCategory(text: string, categories: Category[]): string {
  const lower = text.toLowerCase();
  for (const cat of categories) {
    for (const kw of cat.keywords) {
      const pattern = new RegExp(`(?:^|[^a-zäöüß])${escapeRegex(kw)}(?:[^a-zäöüß]|$)`, "i");
      if (pattern.test(lower)) return cat.name;
    }
  }
  return "Sonstiges";
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseExpense(transcript: string, categories: Category[]): ParsedExpense {
  const { amount, matchedSpan } = extractAmount(transcript);

  let remainder = transcript;
  if (matchedSpan) {
    remainder = (transcript.slice(0, matchedSpan[0]) + " " + transcript.slice(matchedSpan[1])).trim();
  }
  remainder = remainder
    .replace(/\bfür\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const category = guessCategory(transcript, categories);
  const description = remainder.length > 0 ? capitalize(remainder) : category;

  return { amount, category, description };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
