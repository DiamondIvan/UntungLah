import type { ReactNode } from 'react';
import { ArrowDownLeft, ArrowUpRight, BookOpen, Check, CircleHelp, Coins, FlaskConical, Layers3, Play, Plus, ReceiptText, Sparkles, Wallet } from 'lucide-react';
import { rm, snapshot, unitEconomics, type Business } from './domain';
import { getLesson } from './lessons';
import type { CoachResult } from './coach-contract';

export const nav = [
  { id: 'business', label: 'My Business', icon: Wallet },
  { id: 'learning', label: 'Learning Path', icon: BookOpen },
  { id: 'practice', label: 'Practice Lab', icon: FlaskConical },
  { id: 'coach', label: 'AI Coach', icon: Sparkles },
  { id: 'progress', label: 'My Progress', icon: Layers3 },
] as const;
export type Page = typeof nav[number]['id'];

export function Heading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div>{children}</div>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
export function Hero({ sample, start, tryDemo, onboarding }: { sample: boolean; start: () => void; tryDemo: () => void; onboarding?: () => void }) {
  return <section className="hero">
    <div className="hero-copy">
      <span className="eyebrow"><Sparkles size={15} /> Learn with your own numbers</span>
      <h2>Learn smarter.<br />Run better. <em>Earn better.</em></h2>
      <p>Turn everyday sales and expenses into practical business skills. Start with a nasi lemak stall and see what a small pricing change could do.</p>
      <div className="actions">
        <button className="button amber" onClick={start}><Play size={16} fill="currentColor" /> Start Guided Demo</button>
        {!sample && <button className="button hero-secondary" onClick={onboarding ?? tryDemo}>{onboarding ? 'Set up my business' : 'Try demo business'}</button>}
      </div>
    </div>
    <div className="hero-art" aria-hidden="true">
      <div className="art-orbit" /><div className="art-chart"><i /><i /><i /><i /><i /></div><div className="art-coin">RM</div>
    </div>
  </section>;
}
export function Dashboard({ business }: { business: Business }) {
  const totals = snapshot(business.records);
  const hasRecords = business.records.length > 0;
  const unit = business.profile ? unitEconomics(business.profile.price, business.profile.cost) : null;
  const metrics = [
    { title: 'Recorded revenue', value: totals.revenue, note: 'Money in from recorded sales', icon: ArrowUpRight },
    { title: 'Recorded cash outflows', value: totals.outflows, note: 'Ingredient purchases and operating expenses', icon: ArrowDownLeft },
    { title: 'Recorded cash surplus', value: totals.surplus, note: 'Sales receipts minus recorded payments', icon: Wallet },
  ];
  return <>
    <div className="section-heading"><div><h2>Financial snapshot</h2><p>{business.sample ? 'Fictional sample data · All recorded dates' : 'All recorded dates'}</p></div>{business.profile && <span className="pill">{business.profile.product}</span>}</div>
    <div className="metric-grid">{metrics.map(({ title, value, note, icon: Icon }) => <article className="metric card" key={title}>
      <span className="metric-icon"><Icon size={20} /></span><h3>{title}</h3><strong className="metric-value">{hasRecords ? rm(value) : '—'}</strong><p className="metric-note">{note}</p>
    </article>)}</div>
    <div className="dashboard-grid">
      <section className="panel card"><div className="panel-heading"><span className="metric-icon"><ReceiptText size={19} /></span><div><h3>Where your cash went</h3><p>Recorded payments by type</p></div></div>
        {totals.outflows > 0 ? <>
          <div className="spend-bar" role="img" aria-label="Split between ingredient purchases and operating expenses"><span style={{ width: (totals.purchases / totals.outflows * 100) + '%' }} /><span style={{ width: (totals.expenses / totals.outflows * 100) + '%' }} /></div>
          <div className="summary-line"><span><i /> Purchases</span><strong>{rm(totals.purchases)}</strong></div>
          <div className="summary-line"><span><i /> Operating expenses</span><strong>{rm(totals.expenses)}</strong></div>
        </> : <p className="empty-state">Your purchases and expenses will appear here.</p>}
      </section>
      <section className="panel card"><div className="panel-heading"><span className="metric-icon"><Coins size={19} /></span><div><h3>Contribution per unit</h3><p>Selling price less estimated unit cost</p></div></div>
        {unit?.contribution != null ? <><strong className="metric-value">{rm(unit.contribution)}</strong><p>Remains per {business.profile?.product} before other operating expenses.</p><div className="summary-line"><span>Estimated gross margin</span><strong>{unit.margin == null ? 'Unavailable' : unit.margin.toFixed(1) + '%'}</strong></div></> : <p className="empty-state">Add a selling price and estimated production cost to see this figure.</p>}
      </section>
    </div>
    {hasRecords && <p className="metric-note">Cash surplus is a simplified cash measure. Unit contribution uses a production cost estimate and is shown separately from recorded payments.</p>}
  </>;
}
export function CoachAnswer({ result, onGoal }: { result: CoachResult; onGoal: (title: string) => void }) {
  const { source, answer } = result;
  return <section className="coach-results panel card" aria-live="polite">
    <span className={'coach-source pill ' + source}><Sparkles size={14} /> {source === 'qwen' ? 'Qwen AI explanation' : 'Demonstration explanation'}</span>
    {source === 'demo' && <p className="metric-note">Live Qwen is unavailable for this request. You can retry.</p>}
    <h2>{answer.headline}</h2><p>{answer.explanation}</p>
    {answer.keyInsights.length > 0 && <ul>{answer.keyInsights.map((line, index) => <li key={index}>{line}</li>)}</ul>}
    <h3>Practical next steps</h3>
    {answer.recommendations.map((line, index) => <div className="summary-line" key={index}><span>{line}</span><button className="button secondary" onClick={() => onGoal(line)}><Plus size={16} /> Add goal</button></div>)}
    <p><BookOpen size={16} /> Suggested lesson · {getLesson(answer.nextLearningTopic).title}</p>
    {(answer.assumptions.length > 0 || answer.limitations.length > 0) && <details><summary><CircleHelp size={16} /> Assumptions and limitations</summary><ul>{[...answer.assumptions, ...answer.limitations].map((line, index) => <li key={index}>{line}</li>)}</ul></details>}
  </section>;
}
const journey = ['Business', 'Lesson', 'Quiz', 'Practice', 'Explain', 'Goal'];
export function GuidedBar({ step, highest, select, exit }: { step: number; highest: number; select: (step: number) => void; exit: () => void }) {
  return <section className="guided-bar" aria-label="Guided demo progress">
    <div className="section-heading"><div><h2>Guided demo</h2><p>{highest >= journey.length ? 'Journey completed' : 'Step ' + (step + 1) + ' of ' + journey.length}</p></div><button className="button ghost" onClick={exit}>Exit demo guide</button></div>
    <div className="guided-steps">{journey.map((label, index) => <button type="button" key={label} className={'guided-step' + (index === step ? ' active' : '') + (index < highest ? ' done' : '')} aria-current={index === step ? 'step' : undefined} disabled={index > highest} onClick={() => select(index)}><span>{index < highest ? <Check size={14} /> : index + 1}</span>{label}</button>)}</div>
  </section>;
}
