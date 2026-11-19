import { useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowRight, Check, ArrowUpRight, Coins, Pencil, Play, Plus, ReceiptText, RotateCcw, ShoppingBasket, Sparkles, Target, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { Bar, Field, Modal, PageIntro, type Page } from './components';
import { entryAmount, profileSchema, recordSchema, rm, share, snapshot, today, unitEconomics, type Business, type Profile, type RecordEntry, type TopicId } from './domain';
import { getLesson, lessons } from './lessons';

type RecordType = RecordEntry['type'];
const recordLabels: Record<RecordType, string> = { sale: 'Sale', purchase: 'Purchase', expense: 'Expense' };
const recordIcons = { sale: TrendingUp, purchase: ShoppingBasket, expense: ReceiptText };
const recordHints: Record<RecordType, string> = {
  sale: 'Money received for products you sold.',
  purchase: 'Ingredients or packaging you paid for, even if you use them over several days.',
  expense: 'Running costs such as stall fees, gas or transport.',
};

function greeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', hourCycle: 'h23' }).format(date));
  return hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
}

function ProfileForm({ profile, save, cancel }: { profile: Profile | null; save: (value: Profile) => void; cancel: () => void }) {
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const cost = data.get('cost');
    const parsed = profileSchema.safeParse({ name: data.get('name'), type: data.get('type'), product: data.get('product'), price: Number(data.get('price')), cost: cost === '' ? null : Number(cost), language: data.get('language') });
    if (!parsed.success) {
      setError('Check your business details and enter prices in ringgit and sen.');
      return;
    }
    save(parsed.data);
  }
  return <Modal title={profile ? 'Edit business profile' : 'Set up your business'} onClose={cancel}>
    <form onSubmit={submit}>
      <span className="modal-icon sale"><Wallet size={21} /></span>
      <span className="eyebrow">YOUR BUSINESS</span>
      <h2>{profile ? 'Edit business profile' : 'Set up your business'}</h2>
      <p className="modal-lead">Start with one product. You can leave the unit cost blank while you work it out.</p>
      <div className="form-grid">
        <Field label="Business name"><input name="name" defaultValue={profile?.name} maxLength={100} required /></Field>
        <Field label="Business type"><select name="type" defaultValue={profile?.type ?? 'Food stall'}><option>Food stall</option><option>Market vendor</option><option>Home-based business</option><option>Other microbusiness</option></select></Field>
        <Field label="Primary product"><input name="product" defaultValue={profile?.product} maxLength={100} placeholder="e.g. Nasi Lemak" required /></Field>
        <Field label="Preferred language"><select name="language" defaultValue={profile?.language ?? 'English'}><option>English</option><option>Bahasa Melayu</option><option>Other</option></select></Field>
        <Field label="Selling price (RM)"><input type="number" name="price" defaultValue={profile?.price} step="0.01" min="0" max="1000000" inputMode="decimal" required /></Field>
        <Field label="Estimated unit cost (RM)"><input type="number" name="cost" defaultValue={profile?.cost ?? ''} step="0.01" min="0" max="1000000" inputMode="decimal" /></Field>
      </div>
      <p className="note">Lessons and coaching are presented in English for this prototype.</p>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="actions"><button className="button primary">{profile ? 'Save business' : 'Create business'}</button><button type="button" className="button ghost" onClick={cancel}>Cancel</button></div>
    </form>
  </Modal>;
}

function RecordForm({ profile, initial, save, cancel }: { profile: Profile; initial: RecordType; save: (value: RecordEntry) => void; cancel: () => void }) {
  const [type, setType] = useState<RecordType>(initial);
  const [error, setError] = useState('');
  const Icon = recordIcons[type];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const common = { id: crypto.randomUUID(), type, date: data.get('date'), category: data.get('category'), description: data.get('description') };
    const details = type === 'sale'
      ? { product: profile.product, quantity: Number(data.get('quantity')), unitPrice: Number(data.get('unitPrice')) }
      : { amount: Number(data.get('amount')), ...(type === 'purchase' && data.get('associate') ? { product: profile.product } : {}) };
    const parsed = recordSchema.safeParse({ ...common, ...details });
    if (!parsed.success) {
      setError('Enter a valid date, category, and non-negative amount. Sales need a whole quantity above zero.');
      return;
    }
    save(parsed.data);
  }
  return <Modal title="Add a record" onClose={cancel}>
    <form onSubmit={submit}>
      <span className={'modal-icon ' + type}><Icon size={21} /></span>
      <span className="eyebrow">{type === 'sale' ? 'RECORD INCOME' : 'TRACK SPENDING'}</span>
      <h2>{type === 'sale' ? 'Add a sale' : type === 'purchase' ? 'Add a purchase' : 'Add an expense'}</h2>
      <div className="segmented" role="group" aria-label="Record type">
        {(Object.keys(recordLabels) as RecordType[]).map(option => <button type="button" key={option} aria-pressed={type === option} className={type === option ? 'active' : ''} onClick={() => { setType(option); setError(''); }}>{recordLabels[option]}</button>)}
      </div>
      <p className="modal-lead">{recordHints[type]}</p>
      <div className="form-grid">
        {type === 'sale' ? <>
          <Field label={'Quantity · ' + profile.product}><input type="number" name="quantity" min="1" max="100000" step="1" inputMode="numeric" required /></Field>
          <Field label="Unit price (RM)"><input type="number" name="unitPrice" min="0" max="1000000" step="0.01" inputMode="decimal" defaultValue={profile.price} required /></Field>
        </> : <Field label="Amount (RM)"><input key={type} type="number" name="amount" min="0" max="1000000" step="0.01" inputMode="decimal" placeholder="0.00" required /></Field>}
        <Field label="Date"><input type="date" name="date" defaultValue={today()} required /></Field>
        <Field label="Category"><input key={type} name="category" maxLength={100} defaultValue={type === 'sale' ? 'Product sales' : type === 'purchase' ? 'Ingredients' : 'Stall costs'} required /></Field>
        <Field label="Description (optional)"><input name="description" maxLength={250} placeholder="e.g. Morning market" /></Field>
        {type === 'purchase' && <label className="check-label"><input type="checkbox" name="associate" defaultChecked /> For {profile.product}</label>}
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="actions"><button className="button primary">Save record</button><button type="button" className="button ghost" onClick={cancel}>Cancel</button></div>
    </form>
  </Modal>;
}

function Stat({ icon: Icon, tone, title, value, note }: { icon: typeof Wallet; tone: string; title: string; value: string; note: string }) {
  return <article className="stat-card">
    <span className={'stat-icon ' + tone}><Icon size={21} /></span>
    <div><h3>{title}</h3><strong className="stat-value">{value}</strong><span>{note}</span></div>
  </article>;
}

type Props = {
  business: Business; recommended: TopicId; completed: TopicId[]; startGuide: () => void; tryDemo: () => void; resetDemo: () => void;
  saveProfile: (value: Profile) => void; addRecord: (value: RecordEntry) => void; deleteRecord: (id: string) => void;
  openLesson: (topic: TopicId) => void; toggleGoal: (id: string) => void; navigate: (page: Page) => void; guideAdvance?: () => void;
};
export function BusinessPage({ business, recommended, completed, startGuide, tryDemo, resetDemo, saveProfile, addRecord, deleteRecord, openLesson, toggleGoal, navigate, guideAdvance }: Props) {
  const [showProfile, setShowProfile] = useState(false);
  const [recordType, setRecordType] = useState<RecordType | null>(null);
  const [deleteId, setDeleteId] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const guided = Boolean(guideAdvance);
  const { profile } = business;
  const lesson = getLesson(recommended);
  const lessonNumber = lessons.findIndex(item => item.id === recommended) + 1;
  const totals = snapshot(business.records);
  const hasRecords = business.records.length > 0;
  const unit = profile ? unitEconomics(profile.price, profile.cost) : null;
  const goal = business.goals.find(item => !item.completed) ?? business.goals.at(-1);
  const purchaseShare = share(totals.purchases, totals.revenue);
  const insight = purchaseShare !== null && totals.purchases > 0
    ? `Ingredient purchases are ${purchaseShare.toFixed(0)}% of recorded sales. Check that your price covers the full cost of each ${profile?.product ?? 'product'}.`
    : unit?.contribution != null && profile
      ? `Each ${profile.product} leaves about ${rm(unit.contribution)} before other operating expenses. Record a few days of sales to see the bigger picture.`
      : 'Add a sale and an ingredient purchase to see how your spending compares with your sales.';
  const sorted = business.records.slice().sort((a, b) => b.date.localeCompare(a.date));

  return <>
    <PageIntro eyebrow={profile ? greeting() : 'WELCOME TO UNTUNGLAH'} title={profile ? 'Let’s grow your business.' : 'Learn smarter. Run better. Earn better.'}
      text={profile ? profile.name + ' · ' + profile.type : 'Turn everyday sales and expenses into practical business skills.'}>
      {profile && !guided && <div className="quick-actions">
        <button onClick={() => setRecordType('sale')}><span className="quick-icon sale"><Plus size={19} /></span><span><strong>Record sale</strong><small>Add today’s income</small></span></button>
        <button onClick={() => setRecordType('expense')}><span className="quick-icon expense"><Plus size={19} /></span><span><strong>Add expense</strong><small>Purchases and running costs</small></span></button>
        <button className="quick-edit" onClick={() => setShowProfile(true)}><Pencil size={16} /> Edit business</button>
      </div>}
    </PageIntro>

    {!guided && (!profile || business.sample) && <section className={'demo-strip' + (profile ? '' : ' onboarding')}>
      <div><span className="coach-spark"><Sparkles size={19} /></span><div><strong>{profile ? 'See the whole journey in three minutes' : 'Start with your own numbers or a sample stall'}</strong><p>{profile ? 'Record → lesson → quiz → simulation → coaching → goal, using fictional figures.' : 'Set up one product, or explore a fictional nasi lemak stall first.'}</p></div></div>
      <div className="actions">
        <button className="button amber" onClick={startGuide}><Play size={16} fill="currentColor" /> Start Guided Demo</button>
        {!profile && <button className="button primary" onClick={() => setShowProfile(true)}>Set up my business</button>}
        {!profile && <button className="button secondary" onClick={tryDemo}>Try Demo Business</button>}
      </div>
    </section>}

    <div className="section-title"><div><h2>Financial snapshot</h2><p>{business.sample ? 'Fictional sample data · All recorded dates' : 'All recorded dates'}</p></div>{profile && <span className="pill">{profile.product}</span>}</div>
    <section className="stat-grid" aria-label="Financial snapshot">
      <Stat icon={ArrowUpRight} tone="teal" title="Recorded revenue" value={hasRecords ? rm(totals.revenue) : '—'} note="Money in from recorded sales" />
      <Stat icon={ArrowDownLeft} tone="coral" title="Recorded cash outflows" value={hasRecords ? rm(totals.outflows) : '—'} note="Purchases and operating expenses" />
      <Stat icon={Wallet} tone="yellow" title="Recorded cash surplus" value={hasRecords ? rm(totals.surplus) : '—'} note="Sales receipts minus recorded payments" />
    </section>

    <section className="dashboard-grid">
      <div className="focus-card">
        <div className="focus-photo">
          <img src="/market-stall.jpg" alt="" />
          <div className="photo-overlay" />
          <span className="focus-badge">{completed.includes(recommended) ? 'REVIEW' : 'TODAY’S FOCUS'}</span>
          <div className="focus-copy"><p>Your next lesson · Topic {lessonNumber} of {lessons.length}</p><h2>{lesson.title}</h2><p className="focus-summary">{lesson.summary}</p></div>
        </div>
        <div className="lesson-progress">
          <div className="lesson-meta"><span>Learning path</span><strong>{completed.length} of {lessons.length} topics completed</strong></div>
          <Bar value={completed.length} max={lessons.length} label="Learning topics completed" />
          <button className="button primary wide" onClick={guideAdvance ?? (() => openLesson(lesson.id))}><Play size={16} fill="currentColor" /> Open lesson</button>
        </div>
      </div>
      <div className="side-stack">
        <div className="goal-card">
          <div className="card-heading"><div><span className="eyebrow">IMPROVEMENT GOAL</span><h3>{goal ? goal.title : 'No goal yet'}</h3></div><span className="goal-icon"><Target size={20} /></span></div>
          {goal ? <>
            <p>{getLesson(goal.topic).title}{goal.target && ' · Target ' + goal.target}{!goal.completed && goal.target && goal.target < today() && ' · Overdue'}</p>
            {!guided && <button className={'goal-check' + (goal.completed ? ' done' : '')} onClick={() => toggleGoal(goal.id)}><span>{goal.completed && <Check size={13} strokeWidth={3} />}</span>{goal.completed ? 'Completed · tap to reopen' : 'Mark goal complete'}</button>}
          </> : <>
            <p>Try a simulation, then save a practical action from the coach’s suggestions.</p>
            {!guided && <button className="text-button" onClick={() => navigate('practice')}>Go to Practice Lab <ArrowRight size={16} /></button>}
          </>}
        </div>
        <div className="coach-nudge">
          <span className="coach-spark"><Sparkles size={19} /></span>
          <div><span>QUICK INSIGHT · FROM YOUR RECORDS</span><p>{insight}</p>
            {!guided && <button onClick={() => navigate('coach')}>Ask my coach <ArrowRight size={15} /></button>}</div>
        </div>
      </div>
    </section>

    <section className="lower-grid">
      {!guided && profile && <div className="panel">
        <div className="panel-title"><div><span className="eyebrow">RECORDS</span><h3>Transactions</h3><p>{business.sample ? 'Fictional example records and your demo edits.' : 'Sales, ingredient purchases and operating expenses.'}</p></div>
          {business.sample && <button className="button ghost small" onClick={() => setConfirmReset(value => !value)}><RotateCcw size={15} /> Reset Demo Data</button>}</div>
        {confirmReset && <div className="notice" role="alert"><p>Reset the fictional business, transactions, quizzes and goals?</p><div className="actions"><button className="button danger" onClick={() => { resetDemo(); setConfirmReset(false); }}>Confirm demo reset</button><button className="button ghost" onClick={() => setConfirmReset(false)}>Cancel</button></div></div>}
        {sorted.length === 0 ? <p className="empty-state">Add your first sale or business payment to get started.</p> : <ul className="transaction-list">
          {sorted.map(record => {
            const Icon = recordIcons[record.type];
            return <li className="transaction" key={record.id}>
              <span className={'tx-icon ' + record.type}><Icon size={18} /></span>
              <div className="tx-text"><strong>{record.category}</strong>
                <small>{record.date} · {recordLabels[record.type]}{record.type === 'sale' && ` · ${record.quantity} × ${rm(record.unitPrice)}`}{record.type === 'purchase' && record.product && ' · ' + record.product}</small>
                {record.description && <small>{record.description}</small>}</div>
              <b className={record.type === 'sale' ? 'in' : 'out'}>{record.type === 'sale' ? '+' : '−'}{rm(entryAmount(record))}</b>
              {deleteId === record.id
                ? <div className="tx-confirm"><button className="button danger small" onClick={() => { deleteRecord(record.id); setDeleteId(''); }}>Confirm deletion</button><button className="button ghost small" onClick={() => setDeleteId('')}>Cancel</button></div>
                : <button className="icon-button" aria-label={'Delete ' + record.category} onClick={() => setDeleteId(record.id)}><Trash2 size={16} /></button>}
            </li>;
          })}
        </ul>}
      </div>}
      <div className="side-stack">
        <div className="panel">
          <div className="panel-title"><div><span className="eyebrow">ESTIMATE</span><h3>Contribution per unit</h3><p>Selling price less estimated unit cost</p></div><span className="stat-icon yellow"><Coins size={19} /></span></div>
          {unit?.contribution != null ? <>
            <strong className="big-figure">{rm(unit.contribution)}</strong>
            <p>Remains per {profile?.product} before other operating expenses.</p>
            <div className="summary-line"><span>Estimated gross margin</span><strong>{unit.margin == null ? 'Unavailable' : unit.margin.toFixed(1) + '%'}</strong></div>
          </> : <p className="empty-state">Add a selling price and estimated production cost to see this figure.</p>}
        </div>
        <div className="panel">
          <div className="panel-title"><div><span className="eyebrow">RECORDED PAYMENTS</span><h3>Where your cash went</h3></div><span className="stat-icon coral"><ReceiptText size={19} /></span></div>
          {totals.outflows > 0 ? <>
            <div className="spend-bar" role="img" aria-label="Split between ingredient purchases and operating expenses"><span style={{ width: (totals.purchases / totals.outflows * 100) + '%' }} /><span style={{ width: (totals.expenses / totals.outflows * 100) + '%' }} /></div>
            <div className="summary-line"><span><i className="dot purchase" /> Purchases</span><strong>{rm(totals.purchases)}</strong></div>
            <div className="summary-line"><span><i className="dot expense" /> Operating expenses</span><strong>{rm(totals.expenses)}</strong></div>
          </> : <p className="empty-state">Your purchases and expenses will appear here.</p>}
        </div>
      </div>
    </section>
    {hasRecords && <p className="note">Cash surplus is a simplified cash measure. Unit contribution uses a production cost estimate and is shown separately from recorded payments.</p>}

    {showProfile && !guided && <ProfileForm profile={profile} save={value => { saveProfile(value); setShowProfile(false); }} cancel={() => setShowProfile(false)} />}
    {recordType && profile && !guided && <RecordForm profile={profile} initial={recordType} save={value => { addRecord(value); setRecordType(null); }} cancel={() => setRecordType(null)} />}
  </>;
}

