import { useState } from 'react';
import { FlaskConical, Sparkles } from 'lucide-react';
import { CoachAnswer, Field, Heading } from './components';
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
  return <div className="form-grid">{(Object.keys(labels) as (keyof Fields)[]).map(key => <Field label={prefix + ' ' + labels[key]} key={key}><input type="number" min="0" max={key === 'units' ? 100000 : 1000000} step={key === 'units' ? 1 : 0.01} value={values[key]} onChange={event => change({ ...values, [key]: event.target.value })} /></Field>)}</div>;
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
  const [baseline, setBaseline] = useState<Fields>(() => draft(guided ? { price: 5, cost: 3, units: 40 } : initial));
  const [adjusted, setAdjusted] = useState<Fields>(() => draft(guided ? { price: 5.5, cost: 3, units: 40 } : initial));
  const base = parse(baseline);
  const scenario = parse(adjusted);
  const comparison = base.success && scenario.success ? compare(base.data, scenario.data) : null;
  const request: CoachRequest | null = base.success && scenario.success ? { task: 'explain', business: context, simulation: { baseline: base.data, adjusted: scenario.data, kind } } : null;
  const coach = useCoach();
  const visible = request && coach.latest?.key === JSON.stringify(request) ? coach.latest : undefined;

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
  return <>
    <Heading title={guided ? explainStep ? 'Explain your decision' : 'Try a price change' : 'Practice Lab'} description="See what changes when you adjust price, cost or quantity." />
    {!guided && <div className="scenario-tabs" aria-label="Choose a simulation"><button className={'button ' + (kind === 'pricing' ? 'primary' : 'secondary')} aria-pressed={kind === 'pricing'} onClick={() => selectKind('pricing')}>Pricing Decisions</button><button className={'button ' + (kind === 'ingredient' ? 'primary' : 'secondary')} aria-pressed={kind === 'ingredient'} onClick={() => selectKind('ingredient')}>Ingredient Cost Increase</button></div>}
    <section className="card panel">
      <div className="panel-heading"><span className="metric-icon"><FlaskConical size={20} /></span><div><h2>{kind === 'pricing' ? 'Compare two prices' : 'Respond to rising costs'}</h2><p>{kind === 'pricing' ? 'If you change only the price, the quantity stays the same in this scenario.' : 'Try a hypothetical RM0.50 increase in production cost per unit.'}</p></div></div>
      <div className="split-grid">
        <div><h3>Original inputs</h3><Inputs values={baseline} change={setBaseline} prefix="Original" /></div>
        <div><h3>Scenario inputs</h3><Inputs values={adjusted} change={setAdjusted} prefix="Scenario" /></div>
      </div>
      {kind === 'ingredient' && <div className="actions"><button className="button secondary" disabled={!base.success} onClick={() => option('absorb')}>Absorb higher cost</button><button className="button secondary" disabled={!base.success} onClick={() => option('raise')}>Raise price</button><button className="button secondary" disabled={!base.success} onClick={() => option('reduce')}>Reduce variable costs</button></div>}
      {!comparison && <p className="notice" role="status">Enter a price and cost in ringgit and sen, and a whole quantity from 0 to 100,000 in both scenarios.</p>}
    </section>
    {comparison && <section className="card panel">
      <h2>Compare results</h2>
      <div className="table-wrap comparison"><table><thead><tr><th scope="col">Estimated outcome</th><th scope="col">Original</th><th scope="col">Scenario</th></tr></thead><tbody>
        {([
          ['revenue', 'Revenue'], ['variableCost', 'Variable production cost'], ['gross', 'Gross contribution'], ['perUnit', 'Contribution per unit'], ['margin', 'Gross margin'],
        ] as const).map(([key, title]) => {
          const format = (value: number | null) => value === null ? 'Unavailable' : key === 'margin' ? value.toFixed(1) + '%' : rm(value);
          return <tr key={key}><th scope="row">{title}</th><td>{format(comparison.original[key])}</td><td>{format(comparison.scenario[key])}</td></tr>;
        })}
      </tbody></table></div>
      <div className="notice comparison-highlight"><strong>{comparison.difference === 0 ? 'No change' : rm(Math.abs(comparison.difference)) + (comparison.difference > 0 ? ' more' : ' less')}</strong><span> in estimated gross contribution</span></div>
      <p className="metric-note">This scenario uses the quantities you enter and excludes other operating expenses. Actual customer demand may change.</p>
      {kind === 'ingredient' && <p>Absorbing the increase lowers contribution per unit. Raising price helps recover costs per unit, and sales volume may change. Reducing variable costs can help preserve contribution, so check quality and portion size.</p>}
      {visible?.result?.source !== 'qwen' && <button className="button primary" disabled={coach.busy} onClick={() => {
        if (!request) return;
        if (guided && !explainStep) onExplain();
        void coach.ask(request);
      }}><Sparkles size={17} /> {coach.busy ? 'Preparing explanation…' : visible ? 'Retry explanation' : 'Explain This Decision'}</button>}
    </section>}
    {visible?.error && <p role="alert" className="error">{visible.error}</p>}
    {visible?.result && <CoachAnswer result={visible.result} onGoal={title => onGoal(title, kind === 'pricing' ? 'pricing' : 'cost')} />}
  </>;
}
