import { z } from 'zod';

export const money = z.number().finite().min(0).max(1_000_000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001);
export const quantity = z.number().int().min(0).max(100_000);
export const validDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const time = new Date(value);
  return Number.isFinite(time.getTime()) && time.toISOString().slice(0, 10) === value;
});
const label = z.string().trim().min(1).max(100);
export const topicIds = ['records', 'cost', 'pricing', 'profit', 'cash', 'growth'] as const;
export const topicId = z.enum(topicIds);
export type TopicId = z.infer<typeof topicId>;
export const profileSchema = z.object({
  name: label, type: label, product: label, price: money, cost: money.nullable(), language: label,
});
export const recordSchema = z.object({
  id: label, date: validDate, category: label, description: z.string().max(250),
}).and(z.discriminatedUnion('type', [
  z.object({ type: z.literal('sale'), product: label, quantity: quantity.min(1), unitPrice: money }),
  z.object({ type: z.literal('purchase'), amount: money, product: label.optional() }),
  z.object({ type: z.literal('expense'), amount: money }),
]));
const attemptSchema = z.object({ topic: topicId, score: z.number().int().min(0).max(3), total: z.number().int().min(2).max(3), date: validDate }).refine(attempt => attempt.score <= attempt.total);
const goalSchema = z.object({ id: label, title: z.string().trim().min(1).max(180), topic: topicId, target: validDate.or(z.literal('')), completed: z.boolean() });
const stateSchema = z.object({
  profile: profileSchema.nullable(), sample: z.boolean(), records: z.array(recordSchema), attempts: z.array(attemptSchema), goals: z.array(goalSchema),
});
export type Profile = z.infer<typeof profileSchema>;
export type RecordEntry = z.infer<typeof recordSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Business = z.infer<typeof stateSchema>;
export const emptyBusiness: Business = { profile: null, sample: false, records: [], attempts: [], goals: [] };
export const storageKey = 'untunglah.business.v1';
export function readBusiness(storage: Pick<Storage, 'getItem'>, key = storageKey): Business {
  try {
    const result = stateSchema.safeParse(JSON.parse(storage.getItem(key) ?? 'null'));
    return result.success ? result.data : emptyBusiness;
  } catch {
    return emptyBusiness;
  }
}
export function saveBusiness(storage: Pick<Storage, 'setItem'>, business: Business, key = storageKey) {
  storage.setItem(key, JSON.stringify(business));
}
export function today(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export const rm = (amount: number) => new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);
export const cents = (amount: number) => Math.round(amount * 100);
export const salesRevenue = (price: number, units: number) => cents(price) * units / 100;
export const entryAmount = (record: RecordEntry) => record.type === 'sale' ? salesRevenue(record.unitPrice, record.quantity) : record.amount;

export function snapshot(records: RecordEntry[]) {
  const totals = { sale: 0, purchase: 0, expense: 0 };
  for (const record of records) totals[record.type] += cents(entryAmount(record));
  return {
    revenue: totals.sale / 100, purchases: totals.purchase / 100, expenses: totals.expense / 100,
    outflows: (totals.purchase + totals.expense) / 100,
    surplus: (totals.sale - totals.purchase - totals.expense) / 100,
  };
}
export function unitEconomics(price: number, cost: number | null) {
  const contribution = cost === null ? null : (cents(price) - cents(cost)) / 100;
  return {
    contribution, margin: contribution !== null && price > 0 ? contribution / price * 100 : null,
    markup: contribution !== null && cost !== null && cost > 0 ? contribution / cost * 100 : null,
  };
}
export function breakEven(fixed: number, contribution: number | null) {
  return money.safeParse(fixed).success && contribution !== null && Number.isFinite(contribution) && cents(contribution) > 0
    ? Math.ceil(cents(fixed) / cents(contribution)) : null;
}
export const simulationInput = z.object({ price: money, cost: money, units: quantity });
export type SimulationInput = z.infer<typeof simulationInput>;
export function simulate({ price, cost, units }: SimulationInput) {
  const economics = unitEconomics(price, cost);
  return {
    revenue: salesRevenue(price, units), variableCost: salesRevenue(cost, units),
    gross: (cents(price) - cents(cost)) * units / 100,
    perUnit: economics.contribution!, margin: economics.margin,
  };
}
export function compare(baseline: SimulationInput, adjusted: SimulationInput) {
  const original = simulate(baseline);
  const scenario = simulate(adjusted);
  return { original, scenario, difference: (cents(scenario.gross) - cents(original.gross)) / 100 };
}
export function demoBusiness(): Business {
  const date = today();
  return {
    profile: { name: 'Warung Nasi Lemak', type: 'Food stall', product: 'Nasi Lemak', price: 5, cost: 3, language: 'English' },
    sample: true, attempts: [], goals: [],
    records: [
      { id: 'demo-sale', date, type: 'sale', category: 'Food sales', description: 'Sample morning sales', product: 'Nasi Lemak', quantity: 40, unitPrice: 5 },
      { id: 'demo-purchase', date, type: 'purchase', category: 'Ingredients', description: 'Sample batch ingredients', product: 'Nasi Lemak', amount: 120 },
      { id: 'demo-expense', date, type: 'expense', category: 'Stall fee', description: 'Sample daily stall fee', amount: 20 },
    ],
  };
}
export type Question = { prompt: string; options: string[]; correct: number; explanation: string };
export const scoreQuiz = (questions: Question[], answers: number[]) => questions.filter((question, index) => question.correct === answers[index]).length;
