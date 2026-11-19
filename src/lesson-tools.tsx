import { useState, type ReactElement } from 'react';
import { AlertTriangle, Check, CircleCheck, RotateCcw, X } from 'lucide-react';
import { Field } from './components';
import { cashInput, cashPlan, growthInput, parseFields, payback, priceLadder, pricingInput, profitEstimate, profitInput, scoreSort, unitCost, unitCostInput } from './calculators';
import { operatingEstimate, rm, simulate, unitEconomics, type Business, type TopicId } from './domain';
import { sortExercise, type SortCategory } from './lessons';

type ToolProps = { business: Business; onPractise: () => void; onSaveCost: (cost: number) => void };
type Spec = { key: string; label: string; kind?: 'money' | 'units' };

function useFields(initial: Record<string, number>, onPractise: () => void) {
  const [fields, setFields] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(initial).map(([key, value]) => [key, String(value)])));
  return [fields, (key: string, value: string) => { setFields(previous => ({ ...previous, [key]: value })); onPractise(); }] as const;
}
function Inputs({ specs, fields, change }: { specs: Spec[]; fields: Record<string, string>; change: (key: string, value: string) => void }) {
  return <div className="form-grid">{specs.map(spec => <Field key={spec.key} label={spec.label}>
    <input type="number" min="0" max={spec.kind === 'units' ? 100000 : 1000000} step={spec.kind === 'units' ? 1 : 0.01} inputMode={spec.kind === 'units' ? 'numeric' : 'decimal'} value={fields[spec.key]} onChange={event => change(spec.key, event.target.value)} />
  </Field>)}</div>;
}
function Invalid() {
  return <p className="tool-invalid" role="status">Enter amounts in ringgit and sen, and whole numbers for quantities.</p>;
}
function Rows({ rows }: { rows: [string, string, boolean?][] }) {
  return <div className="tool-rows">{rows.map(([label, value, strong]) => <div key={label} className={strong ? 'strong' : ''}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}
/** Units sold of the primary product on the latest recorded sales date, if any. */
function recentUnits(business: Business) {
  const product = business.profile?.product;
  const sales = business.records.filter(record => record.type === 'sale' && record.product === product);
  const latest = sales.map(record => record.date).sort().at(-1);
  return sales.reduce((sum, record) => sum + (record.type === 'sale' && record.date === latest ? record.quantity : 0), 0) || null;
}

const categories: { id: SortCategory; label: string }[] = [{ id: 'sale', label: 'Sale' }, { id: 'purchase', label: 'Purchase' }, { id: 'expense', label: 'Expense' }, { id: 'wastage', label: 'Wastage' }];
function SortTool({ onPractise }: ToolProps) {
  const [answers, setAnswers] = useState<(SortCategory | undefined)[]>([]);
  const [checked, setChecked] = useState(false);
  const score = scoreSort(sortExercise, answers);
  return <div className="tool">
    <ol className="sort-list">{sortExercise.map((item, index) => {
      const answer = answers[index];
      const right = checked && answer === item.answer;
      return <li key={item.text} className={checked ? (right ? 'right' : 'wrong') : ''}>
        <span className="sort-text">{item.text}</span>
        <div className="segmented small" role="group" aria-label={'Category for: ' + item.text}>
          {categories.map(category => <button key={category.id} type="button" aria-pressed={answer === category.id} className={answer === category.id ? 'active' : ''} disabled={checked}
            onClick={() => setAnswers(previous => { const next = [...previous]; next[index] = category.id; return next; })}>{category.label}</button>)}
        </div>
        {checked && <small className="sort-why">{right ? <Check size={14} /> : <X size={14} />} {right ? item.why : 'It’s a ' + categories.find(category => category.id === item.answer)!.label.toLowerCase() + '. ' + item.why}</small>}
      </li>;
    })}</ol>
    <div className="actions">
      {!checked ? <button className="button primary" disabled={answers.filter(Boolean).length < sortExercise.length} onClick={() => { setChecked(true); onPractise(); }}>Check my answers</button>
        : <><strong className="tool-score">{score} of {sortExercise.length} correct</strong><button className="button ghost" onClick={() => { setAnswers([]); setChecked(false); }}><RotateCcw size={15} /> Try again</button></>}
    </div>
  </div>;
}

function CostTool({ business, onPractise, onSaveCost }: ToolProps) {
  const [fields, change] = useFields({ ingredients: 90, packaging: 10, other: 10, units: 50 }, onPractise);
  const [saved, setSaved] = useState<number | null>(null);
  const parsed = parseFields(unitCostInput, fields);
  const result = parsed.success ? unitCost(parsed.data) : null;
  const product = business.profile?.product ?? 'unit';
  return <div className="tool">
    <Inputs fields={fields} change={change} specs={[{ key: 'ingredients', label: 'Ingredients used (RM)' }, { key: 'packaging', label: 'Packaging used (RM)' }, { key: 'other', label: 'Other allocated costs, e.g. gas (RM)' }, { key: 'units', label: 'Units produced', kind: 'units' }]} />
    {!result ? <Invalid /> : <div className="tool-result">
      <Rows rows={[['Total production cost', rm(result.total)], ['Cost per ' + product.toLowerCase(), result.perUnit === null ? 'Unavailable' : rm(result.perUnit), true]]} />
      {result.perUnit === null && <p className="note">Enter at least one unit produced to calculate a cost per unit.</p>}
      {result.perUnitSen !== null && business.profile && (saved === result.perUnitSen
        ? <p className="tool-ok"><CircleCheck size={16} /> Saved {rm(saved)} as the estimated unit cost for {business.profile.product}.</p>
        : <button className="button secondary" onClick={() => { onSaveCost(result.perUnitSen!); setSaved(result.perUnitSen); }}>Use {rm(result.perUnitSen)} as my estimated unit cost</button>)}
    </div>}
  </div>;
}

function PricingTool({ business, onPractise }: ToolProps) {
  const profile = business.profile;
  const [fields, change] = useFields({ price: profile?.price ?? 4.5, cost: profile?.cost ?? 2.7, units: recentUnits(business) ?? 50 }, onPractise);
  const parsed = parseFields(pricingInput, fields);
  const result = parsed.success ? simulate(parsed.data) : null;
  return <div className="tool">
    <Inputs fields={fields} change={change} specs={[{ key: 'price', label: 'Selling price (RM)' }, { key: 'cost', label: 'Unit cost (RM)' }, { key: 'units', label: 'Expected quantity sold', kind: 'units' }]} />
    {!result || !parsed.success ? <Invalid /> : <div className="tool-result">
      <Rows rows={[['Gross profit per unit', rm(result.perUnit), true], ['Gross margin', result.margin === null ? 'Unavailable' : result.margin.toFixed(1) + '%'], ['Total gross profit', rm(result.gross)]]} />
      <table className="tool-table"><caption>Same cost and quantity, different prices</caption><thead><tr><th scope="col">Selling price</th><th scope="col">Unit cost</th><th scope="col">Gross profit / unit</th></tr></thead>
        <tbody>{priceLadder(parsed.data).map(row => <tr key={row.price} className={row.price === parsed.data.price ? 'current' : ''}><td>{rm(row.price)}</td><td>{rm(parsed.data.cost)}</td><td>{rm(row.perUnit)}</td></tr>)}</tbody></table>
      <p className="note">Assumes every unit is sold at this price. A different price may change how many customers buy.</p>
    </div>}
  </div>;
}

function ProfitTool({ business, onPractise }: ToolProps) {
  const profile = business.profile;
  const estimate = operatingEstimate(business);
  const [fields, change] = useFields({
    price: profile?.price ?? 4.5, units: estimate?.units ?? 50, cost: profile?.cost ?? 2.2, operating: estimate ? estimate.expenses : 35,
  }, onPractise);
  const parsed = parseFields(profitInput, fields);
  const result = parsed.success ? profitEstimate(parsed.data) : null;
  return <div className="tool">
    <Inputs fields={fields} change={change} specs={[{ key: 'price', label: 'Selling price (RM)' }, { key: 'units', label: 'Units sold', kind: 'units' }, { key: 'cost', label: 'Cost per unit (RM)' }, { key: 'operating', label: 'Other operating expenses (RM)' }]} />
    {!result ? <Invalid /> : <div className="tool-result">
      <Rows rows={[['Revenue', rm(result.revenue)], ['Cost of goods sold', '−' + rm(result.goodsSold)], ['Gross profit', rm(result.gross)], ['Other operating expenses', '−' + rm(parsed.success ? parsed.data.operating : 0)], ['Estimated operating profit', rm(result.operating), true]]} />
      <p className="tool-callout">{result.breakEvenUnits === null ? 'Break-even is unavailable: each unit must sell for more than it costs to make.' : `Break-even: sell ${result.breakEvenUnits} ${result.breakEvenUnits === 1 ? 'unit' : 'units'} to cover the operating expenses.`}</p>
      <p className="note">Estimate before taxes, loan costs, equipment wear and the owner’s own pay.</p>
    </div>}
  </div>;
}

function CashTool({ onPractise }: ToolProps) {
  const [fields, change] = useFields({ opening: 200, inflows: 225, supplier: 80, other: 35 }, onPractise);
  const parsed = parseFields(cashInput, fields);
  const result = parsed.success ? cashPlan(parsed.data) : null;
  return <div className="tool">
    <Inputs fields={fields} change={change} specs={[{ key: 'opening', label: 'Starting cash (RM)' }, { key: 'inflows', label: 'Expected sales collections (RM)' }, { key: 'supplier', label: 'Supplier payments due (RM)' }, { key: 'other', label: 'Rent and other bills due (RM)' }]} />
    {!result ? <Invalid /> : <div className="tool-result">
      <Rows rows={[['Projected closing cash', rm(result.closing), true]]} />
      {result.shortfall > 0
        ? <p className="tool-warn" role="alert"><AlertTriangle size={16} /> You may be {rm(result.shortfall)} short. Consider delaying a purchase, collecting payments sooner or keeping more cash aside.</p>
        : <p className="tool-ok"><CircleCheck size={16} /> These payments fit the cash you expect to have.</p>}
      <p className="note">Only counts the amounts you enter. Check when each payment is actually due.</p>
    </div>}
  </div>;
}

function GrowthTool({ business, onPractise }: ToolProps) {
  const contribution = business.profile ? unitEconomics(business.profile.price, business.profile.cost).contribution : null;
  const [fields, change] = useFields({ equipment: 300, extraUnits: 10, profitPerUnit: contribution !== null && contribution > 0 ? contribution : 2.3, extraDailyCost: 3, savings: 400 }, onPractise);
  const parsed = parseFields(growthInput, fields);
  const result = parsed.success ? payback(parsed.data) : null;
  return <div className="tool">
    <Inputs fields={fields} change={change} specs={[{ key: 'equipment', label: 'Equipment cost (RM)' }, { key: 'extraUnits', label: 'Extra units sold per day', kind: 'units' }, { key: 'profitPerUnit', label: 'Gross profit per extra unit (RM)' }, { key: 'extraDailyCost', label: 'Extra running cost per day (RM)' }, { key: 'savings', label: 'Savings available (RM)' }]} />
    {!result ? <Invalid /> : <div className="tool-result">
      <Rows rows={[['Extra gross profit per day', rm(result.dailyGain)], ['Days to recover the cost', result.days === null ? 'Not recovered' : String(result.days), true], ['Savings left after buying', rm(result.savingsLeft)]]} />
      {result.days === null && <p className="tool-warn" role="alert"><AlertTriangle size={16} /> The extra running cost is as large as the extra profit, so this purchase would not pay for itself.</p>}
      {!result.affordable && <p className="tool-warn" role="alert"><AlertTriangle size={16} /> Your savings do not cover the purchase. Borrowing adds repayments and risk.</p>}
      {result.affordable && result.days !== null && result.savingsLeft < 100 && <p className="tool-warn"><AlertTriangle size={16} /> Little would be left for emergencies after this purchase.</p>}
      <p className="note">Assumes the extra customers really appear every day. Test demand first, for example by tracking sell-outs for two weeks.</p>
    </div>}
  </div>;
}

const tools: Record<TopicId, (props: ToolProps) => ReactElement> = { records: SortTool, cost: CostTool, pricing: PricingTool, profit: ProfitTool, cash: CashTool, growth: GrowthTool };
export function LessonTool({ topic, ...props }: ToolProps & { topic: TopicId }) {
  const Tool = tools[topic];
  return <Tool key={topic} {...props} />;
}
