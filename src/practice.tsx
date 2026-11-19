import { useState } from 'react';
import { FlaskConical, Sparkles } from 'lucide-react';
import { CoachAnswer, Field, PageIntro } from './components';
import { cents, compare, rm, simulationInput, type Business, type SimulationInput } from './domain';
import type { CoachRequest } from './coach-contract';
import { useCoach } from './use-coach';

type Kind = 'pricing' | 'ingredient';
type Fields = Record<keyof SimulationInput, string>;
const labels = { price: 'selling price (RM)', cost: 'unit production cost (RM)', units: 'quantity sold' };
function draft(input: Partial<SimulationInput>): Fields {
  return { price: String(input.price ?? ''), cost: String(input.cost ?? ''), units: String(input.units ?? '') };
}
function parse(input: Fields) {
  return simulationInput.safeParse(Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value.trim() === '' ? undefined : Number(value)])));
}
function Inputs({ values, change, prefix }: { values: Fields; change: (value: Fields) => void; prefix: string }) {
  return <div className="form-grid three">{(Object.keys(labels) as (keyof Fields)[]).map(key => <Field label={prefix + ' ' + labels[key]} key={key}>
    <input type="number" min="0" max={key === 'units' ? 100000 : 1000000} step={key === 'units' ? 1 : 0.01} inputMode={key === 'units' ? 'numeric' : 'decimal'} value={values[key]} onChange={event => change({ ...values, [key]: event.target.value })} />
  </Field>)}</div>;
}
function Slider({ label, value, max, step, format, change }: { label: string; value: string; max: number; step: number; format: (value: number) => string; change: (value: string) => void }) {
  const number = Number(value);
  const valid = value.trim() !== '' && Number.isFinite(number);
  return <div className="slider">
    <span>{label} <strong>{valid ? format(number) : '—'}</strong></span>
    <input type="range" aria-label={'Adjust ' + label.toLowerCase()} min={0} max={max} step={step} value={valid ? Math.min(number, max) : 0} onChange={event => change(event.target.value)} />
    <small><i>{format(0)}</i><i>{format(max)}</i></small>
  </div>;
}
export function PracticePage({ business, context, guided, explainStep, onExplain, onGoal }: {
  business: Business; context: CoachRequest['business']; guided: boolean; explainStep: boolean; onExplain: () => void; onGoal: (title: string, topic: 'pricing' | 'cost') => void;
}) {
  const profile = business.profile;
  const sales = business.records.filter(record => record.type === 'sale').filter(record => record.product === profile?.product);
  const recentDate = sales.map(record => record.date).sort().at(-1);
  const recentUnits = sales.filter(record => record.date === recentDate).reduce((sum, record) => sum + record.quantity, 0);
  const initial = { price: profile?.price, cost: profile?.cost ?? undefined, units: recentDate ? recentUnits : undefined };
  const [kind, setKind] = useState<Kind>('pricing');
  const [baseline, setBaseline] = useState<Fields>(() => draft(guided ? { price: 4.5, cost: 2.2, units: 50 } : initial));
  const [adjusted, setAdjusted] = useState<Fields>(() => draft(guided ? { price: 5, cost: 2.2, units: 50 } : initial));
  const base = parse(baseline);
  const scenario = parse(adjusted);
  const comparison = base.success && scenario.success ? compare(base.data, scenario.data) : null;
  const request: CoachRequest | null = base.success && scenario.success ? { task: 'explain', business: context, simulation: { baseline: base.data, adjusted: scenario.data, kind } } : null;
  const coach = useCoach();
  const visible = request && coach.latest?.key === JSON.stringify(request) ? coach.latest : undefined;
  const priceMax = Math.max(10, Math.ceil((base.success ? base.data.price : 0) * 2));
  const costMax = Math.max(10, Math.ceil((base.success ? base.data.cost : 0) * 2));
  const unitsMax = Math.max(100, (base.success ? base.data.units : 0) * 2);
  const money = (value: number) => 'RM ' + value.toFixed(2);

  function selectKind(selected: Kind) {
    setKind(selected);
    setAdjusted(selected === 'ingredient' && base.success ? draft({ ...base.data, cost: Math.min(1_000_000, (cents(base.data.cost) + 50) / 100) }) : { ...baseline });
  }
  function option(choice: 'absorb' | 'raise' | 'reduce') {
    if (!base.success) return;
    const { cost, price } = base.data;
    const shifted = Math.min(1_000_000, (cents(cost) + 50) / 100);
    const newPrice = choice === 'raise' ? Math.min(1_000_000, (cents(price) + 50) / 100) : price;
    const newCost = choice === 'reduce' ? Math.max(cost, (cents(shifted) - 25) / 100) : shifted;
    setAdjusted({ ...adjusted, price: String(newPrice), cost: String(newCost) });
  }
  const rows = [['revenue', 'Revenue'], ['variableCost', 'Variable production cost'], ['perUnit', 'Contribution per unit'], ['margin', 'Gross margin']] as const;
  const format = (key: typeof rows[number][0], value: number | null) => value === null ? 'Unavailable' : key === 'margin' ? value.toFixed(1) + '%' : rm(value);

  return <>
    <PageIntro eyebrow="TRY BEFORE YOU APPLY" title={guided ? explainStep ? 'Explain your decision' : 'Try a price change' : 'Practice Lab'} text="Test a business decision safely and compare it with where you are today." />
    {!guided && <div className="segmented tabs" role="group" aria-label="Choose a simulation">
      <button className={kind === 'pricing' ? 'active' : ''} aria-pressed={kind === 'pricing'} onClick={() => selectKind('pricing')}>Pricing Decisions</button>
      <button className={kind === 'ingredient' ? 'active' : ''} aria-pressed={kind === 'ingredient'} onClick={() => selectKind('ingredient')}>Ingredient Cost Increase</button>
    </div>}
    <div className="practice-layout">
      <section className="scenario-card">
        <div className="scenario-top"><span><FlaskConical size={22} /></span><div><small>{kind === 'pricing' ? 'PRICING SCENARIO' : 'COST SCENARIO'}</small><h2>{kind === 'pricing' ? 'What if you change your price?' : 'What if ingredients cost more?'}</h2></div></div>
        <p>{kind === 'pricing' ? 'If you change only the price, the quantity stays the same in this scenario. Change the quantity too to test lower or higher demand.' : 'Try a hypothetical RM0.50 increase in production cost per unit, then compare three ways to respond.'}</p>
        <h3>Where you are now</h3>
        <Inputs values={baseline} change={setBaseline} prefix="Original" />
        <h3>Your change</h3>
        {kind === 'pricing'
          ? <Slider label="New selling price" value={adjusted.price} max={priceMax} step={0.1} format={money} change={price => setAdjusted({ ...adjusted, price })} />
          : <Slider label="New unit cost" value={adjusted.cost} max={costMax} step={0.05} format={money} change={cost => setAdjusted({ ...adjusted, cost })} />}
        <Slider label="Expected units sold" value={adjusted.units} max={unitsMax} step={1} format={value => value.toFixed(0)} change={units => setAdjusted({ ...adjusted, units })} />
        {kind === 'ingredient' && <div className="actions options"><button className="button secondary" disabled={!base.success} onClick={() => option('absorb')}>Absorb higher cost</button><button className="button secondary" disabled={!base.success} onClick={() => option('raise')}>Raise price</button><button className="button secondary" disabled={!base.success} onClick={() => option('reduce')}>Reduce variable costs</button></div>}
        <details className="exact-inputs" open={guided}>
          <summary>Type exact scenario figures</summary>
          <Inputs values={adjusted} change={setAdjusted} prefix="Scenario" />
        </details>
        <div className="assumption">
          <strong>Assumptions</strong>
          {comparison && base.success && scenario.success
            ? <p>Original: {rm(base.data.price)} price, {rm(base.data.cost)} cost per unit, {base.data.units} units sold. Scenario: {rm(scenario.data.price)} price, {rm(scenario.data.cost)} cost per unit, {scenario.data.units} units sold. Every unit made is sold, and other operating expenses are left out. Real customer demand may change.</p>
            : <p>Enter a price and cost in ringgit and sen, and a whole quantity from 0 to 100,000 in both scenarios.</p>}
        </div>
      </section>
      <section className="result-card" aria-live="polite">
        <span className="eyebrow">SIMULATED RESULT</span>
        <h2>Compare results</h2>
        {comparison ? <>
          <div className="result-main">
            <span>Estimated gross contribution</span>
            <strong>{rm(comparison.scenario.gross)}</strong>
            <p className={'difference' + (comparison.difference < 0 ? ' down' : '')}><em>{comparison.difference === 0 ? 'No change' : rm(Math.abs(comparison.difference)) + (comparison.difference > 0 ? ' more' : ' less')}</em> <span>vs original {rm(comparison.original.gross)}</span></p>
          </div>
          <table className="result-table"><thead><tr><th scope="col">Estimate</th><th scope="col">Original</th><th scope="col">Scenario</th></tr></thead><tbody>
            {rows.map(([key, title]) => <tr key={key}><th scope="row">{title}</th><td>{format(key, comparison.original[key])}</td><td>{format(key, comparison.scenario[key])}</td></tr>)}
          </tbody></table>
          <div className="result-insight"><Sparkles size={18} /><p><strong>What this means</strong>
            {kind === 'pricing'
              ? `At this price, each unit contributes ${rm(comparison.scenario.perUnit)} before other operating expenses. A higher price may change how many customers buy.`
              : 'Absorbing the increase lowers contribution per unit. Raising price helps recover costs per unit, and sales volume may change. Reducing variable costs can help preserve contribution, so check quality and portion size.'}</p></div>
          {visible?.result?.source !== 'qwen' && <button className="button amber wide" disabled={coach.busy} onClick={() => {
            if (!request) return;
            if (guided && !explainStep) onExplain();
            void coach.ask(request);
          }}><Sparkles size={17} /> {coach.busy ? 'Preparing explanation…' : visible ? 'Retry explanation' : 'Explain This Decision'}</button>}
        </> : <p className="result-empty">Complete both sets of figures to compare the outcomes.</p>}
      </section>
    </div>
    {visible?.error && <p role="alert" className="error">{visible.error}</p>}
    {visible?.result && <div className="panel coach-panel"><CoachAnswer result={visible.result} onGoal={title => onGoal(title, kind === 'pricing' ? 'pricing' : 'cost')} /></div>}
  </>;
}
