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
const stepsSchema = z.object({ learned: z.array(topicId).max(6), practised: z.array(topicId).max(6) });
const stateSchema = z.object({
  profile: profileSchema.nullable(), sample: z.boolean(), records: z.array(recordSchema), attempts: z.array(attemptSchema), goals: z.array(goalSchema),
  // Added with the four-step lessons; older saved workspaces load with no steps recorded.
  steps: stepsSchema.default(() => ({ learned: [], practised: [] })),
});
export type Profile = z.infer<typeof profileSchema>;
export type RecordEntry = z.infer<typeof recordSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Business = z.infer<typeof stateSchema>;
export type LessonStep = keyof z.infer<typeof stepsSchema>;
export const emptyBusiness: Business = { profile: null, sample: false, records: [], attempts: [], goals: [], steps: { learned: [], practised: [] } };
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
    profile: { name: 'Mak Cik’s Nasi Lemak', type: 'Food stall', product: 'Nasi Lemak', price: 4.5, cost: 2.2, language: 'English' },
    sample: true, attempts: [], goals: [], steps: { learned: [], practised: [] },
    records: [
      { id: 'demo-sale', date, type: 'sale', category: 'Food sales', description: 'Sample pasar malam sales', product: 'Nasi Lemak', quantity: 50, unitPrice: 4.5 },
      { id: 'demo-purchase', date, type: 'purchase', category: 'Ingredients', description: 'Rice, eggs and sambal ingredients', product: 'Nasi Lemak', amount: 80 },
      { id: 'demo-transport', date, type: 'expense', category: 'Transport', description: 'Sample trip to the market', amount: 15 },
      { id: 'demo-rental', date, type: 'expense', category: 'Stall rental', description: 'Sample daily stall rental', amount: 20 },
    ],
  };
}
/** Percentage of `part` in `whole`, computed in sen. Unavailable when the whole is zero or negative. */
export function share(part: number, whole: number): number | null {
  const base = cents(whole);
  return base > 0 && Number.isFinite(part) ? cents(part) / base * 100 : null;
}
/** Learning and record-keeping activity derived from stored state for progress displays. */
export function activity(business: Business) {
  const answered = business.attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const correct = business.attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  return {
    recordDays: new Set(business.records.map(record => record.date)).size,
    quizAverage: answered > 0 ? Math.round(correct / answered * 100) : null,
    goalsDone: business.goals.filter(goal => goal.completed).length,
    goalsTotal: business.goals.length,
  };
}
/**
 * Estimated operating profit for the primary product from recorded sales: revenue minus
 * (units sold × estimated unit cost) minus recorded operating expenses. Purchases are cash
 * paid for stock and are not counted again. Unavailable without a unit cost or matching sales.
 */
export function operatingEstimate(business: Business) {
  const profile = business.profile;
  if (!profile || profile.cost === null) return null;
  const sales = business.records.filter(record => record.type === 'sale' && record.product === profile.product);
  if (!sales.length) return null;
  let revenue = 0, units = 0, expenses = 0;
  for (const record of business.records) {
    if (record.type === 'expense') expenses += cents(record.amount);
  }
  for (const sale of sales) if (sale.type === 'sale') { revenue += cents(sale.unitPrice) * sale.quantity; units += sale.quantity; }
  const goodsSold = cents(profile.cost) * units;
  return { units, revenue: revenue / 100, goodsSold: goodsSold / 100, gross: (revenue - goodsSold) / 100, expenses: expenses / 100, operating: (revenue - goodsSold - expenses) / 100 };
}
export type Question = { prompt: string; options: string[]; correct: number; explanation: string };
export const scoreQuiz = (questions: Question[], answers: number[]) => questions.filter((question, index) => question.correct === answers[index]).length;
