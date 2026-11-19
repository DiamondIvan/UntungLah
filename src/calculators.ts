import { z } from 'zod';
import { breakEven, cents, money, quantity, simulate } from './domain';
import type { SortCategory, SortItem } from './lessons';

/** Deterministic calculators behind each lesson's "Try it yourself" step. Inputs are validated money (RM) and whole quantities. */

export const unitCostInput = z.object({ ingredients: money, packaging: money, other: money, units: quantity });
export function unitCost({ ingredients, packaging, other, units }: z.infer<typeof unitCostInput>) {
  const total = cents(ingredients) + cents(packaging) + cents(other);
  return {
    total: total / 100,
    perUnit: units > 0 ? total / units / 100 : null,
    /** Per-unit cost rounded to the nearest sen, for saving as an estimated unit cost. */
    perUnitSen: units > 0 ? Math.round(total / units) / 100 : null,
  };
}

export const pricingInput = z.object({ price: money, cost: money, units: quantity });
/** Gross profit at the given price plus RM0.50 either side, at the same cost and quantity. */
export function priceLadder(input: z.infer<typeof pricingInput>) {
  return [-50, 0, 50]
    .map(step => cents(input.price) + step)
    .filter(price => price >= 0 && price <= 100_000_000)
    .map(price => ({ price: price / 100, ...simulate({ ...input, price: price / 100 }) }));
}

export const profitInput = z.object({ price: money, units: quantity, cost: money, operating: money });
export function profitEstimate({ price, units, cost, operating }: z.infer<typeof profitInput>) {
  const revenue = cents(price) * units;
  const goodsSold = cents(cost) * units;
  return {
    revenue: revenue / 100, goodsSold: goodsSold / 100, gross: (revenue - goodsSold) / 100,
    operating: (revenue - goodsSold - cents(operating)) / 100,
    breakEvenUnits: breakEven(operating, (cents(price) - cents(cost)) / 100),
  };
}

export const cashInput = z.object({ opening: money, inflows: money, supplier: money, other: money });
export function cashPlan({ opening, inflows, supplier, other }: z.infer<typeof cashInput>) {
  const closing = cents(opening) + cents(inflows) - cents(supplier) - cents(other);
  return { closing: closing / 100, shortfall: closing < 0 ? -closing / 100 : 0 };
}

export const growthInput = z.object({ equipment: money, extraUnits: quantity, profitPerUnit: money, extraDailyCost: money, savings: money });
/** Days for an equipment purchase to pay for itself from extra daily gross profit, under the stated assumptions. */
export function payback({ equipment, extraUnits, profitPerUnit, extraDailyCost, savings }: z.infer<typeof growthInput>) {
  const daily = cents(profitPerUnit) * extraUnits - cents(extraDailyCost);
  const left = cents(savings) - cents(equipment);
  return { dailyGain: daily / 100, days: daily > 0 ? Math.ceil(cents(equipment) / daily) : null, savingsLeft: left / 100, affordable: left >= 0 };
}

export function scoreSort(items: SortItem[], answers: (SortCategory | undefined)[]) {
  return items.filter((item, index) => answers[index] === item.answer).length;
}

/** Parse a record of text fields into numbers for a schema, treating blanks as missing. */
export function parseFields<T extends z.ZodTypeAny>(schema: T, fields: Record<string, string>) {
  return schema.safeParse(Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim() === '' ? undefined : Number(value)]))) as z.ZodSafeParseResult<z.infer<T>>;
}
