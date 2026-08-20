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

interface AmountMatch {
  amount: number;
  start: number;
  end: number;
}

/**
 * Finds the leftmost monetary amount in `text`, trying several phrasings
 * and returning whichever occurs first: "3,50 Euro", "17 Euro", "50 Cent",
 * "drei Euro fünfzig", "5 Euro 20 Cent", or a bare decimal like "1,20".
 */
function findLeftmostAmount(text: string): AmountMatch | null {
  let best: AmountMatch | null = null;
  const consider = (start: number, end: number, amount: number) => {
    if (best === null || start < best.start) best = { amount, start, end };
  };

  const euroMatch = text.match(/(\d+(?:[.,]\d{1,2})?|[a-zäöüß]+)\s*(?:euro|€)/i);
  if (euroMatch) {
    const startIdx = euroMatch.index ?? 0;
    const euroTok = extractNumberToken(text, startIdx);
    if (euroTok) {
      let amount = euroTok.value;
      let endIdx = euroTok.endIndex;
      const afterEuro = text.slice(euroTok.endIndex).match(/^\s*(?:euro|€)\s*(?:und\s*)?/i);
      if (afterEuro) {
        endIdx = euroTok.endIndex + afterEuro[0].length;
        const centTok = extractNumberToken(text, endIdx);
        if (centTok && Number.isInteger(amount)) {
          const isCentContext = text.slice(centTok.endIndex).match(/^\s*cent/i);
          if (isCentContext || centTok.value < 100) {
            amount += centTok.value >= 1 ? centTok.value / 100 : 0;
            endIdx = centTok.endIndex + (isCentContext?.[0].length ?? 0);
          }
        }
      }
      consider(startIdx, endIdx, amount);
    }
  }

  const centMatch = text.match(/(\d+|[a-zäöüß]+)\s*cent/i);
  if (centMatch) {
    const startIdx = centMatch.index ?? 0;
    const tok = extractNumberToken(text, startIdx);
    if (tok) {
      const endIdx = tok.endIndex + (text.slice(tok.endIndex).match(/^\s*cent/i)?.[0].length ?? 0);
      consider(startIdx, endIdx, tok.value / 100);
    }
  }

  const decimalMatch = text.match(/\d+[.,]\d{2}\b/);
  if (decimalMatch) {
    const startIdx = decimalMatch.index ?? 0;
    consider(startIdx, startIdx + decimalMatch[0].length, parseFloat(decimalMatch[0].replace(",", ".")));
  }

  return best;
}

/** Scans `text` left to right, collecting every monetary amount mentioned. */
function findAmountAnchors(text: string): AmountMatch[] {
  const anchors: AmountMatch[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const found = findLeftmostAmount(text.slice(cursor));
    if (!found) break;
    anchors.push({ amount: found.amount, start: cursor + found.start, end: cursor + found.end });
    cursor += found.end;
  }
  return anchors;
}

const FILLER_WORDS = new Set([
  "ich", "habe", "hab", "für", "und", "dann", "war", "noch", "ausgegeben",
  "um", "auch", "sowie", "außerdem", "an", "am", "beim", "bei", "hatte", "gehabt",
  "den", "dem", "der", "die", "das", "eingekauft", "gekauft", "gewesen",
  "bin", "bezahlt", "gemacht", "erledigt", "mir", "mich", "sich", "machen",
  "lassen", "so", "weiter", "will", "wollte", "möchte", "geht", "gegangen",
  "wie", "es",
]);

// Real item names are short; a much longer "description" almost always
// means the parser failed to isolate the amount and grabbed leftover
// sentence fragments instead. Capping it keeps that failure visible and
// harmless rather than dumping the whole utterance into one entry.
const MAX_DESCRIPTION_WORDS = 5;

function cleanDescription(text: string): string {
  const words = text
    .split(/\s+/)
    .filter((w) => w && !FILLER_WORDS.has(w.toLowerCase().replace(/[.,!?]/g, "")));
  return words.slice(0, MAX_DESCRIPTION_WORDS).join(" ").trim();
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

/**
 * Splits a spoken (or typed) sentence into one or more individual expenses,
 * e.g. "Cola 1,20 und Brot 3,50 und tanken 130 Euro" becomes three items.
 * When no amount is found at all, a single empty-amount draft is returned
 * so the user can fill it in by hand.
 */
export function parseExpenses(transcript: string, categories: Category[]): ParsedExpense[] {
  const lower = transcript.toLowerCase();
  const anchors = findAmountAnchors(lower);

  if (anchors.length === 0) {
    const category = guessCategory(lower, categories);
    const cleaned = cleanDescription(lower);
    return [{ amount: null, category, description: cleaned ? capitalize(cleaned) : category }];
  }

  const items: ParsedExpense[] = [];
  let prevEnd = 0;
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    const nextStart = anchors[i + 1]?.start ?? lower.length;
    const beforeSlice = lower.slice(prevEnd, anchor.start);
    const afterSlice = lower.slice(anchor.end, nextStart);

    const cleanedBefore = cleanDescription(beforeSlice);
    const cleaned = cleanedBefore || cleanDescription(afterSlice);
    // Only fall back to the next item's slice for category hints when this
    // item has no description of its own, to avoid misclassifying an item
    // by keywords that actually belong to its neighbor.
    const categorySource = cleanedBefore ? beforeSlice : `${beforeSlice} ${afterSlice}`;
    const category = guessCategory(categorySource, categories);
    const description = cleaned ? capitalize(cleaned) : category;

    items.push({ amount: anchor.amount, category, description });
    prevEnd = anchor.end;
  }
  return items;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
