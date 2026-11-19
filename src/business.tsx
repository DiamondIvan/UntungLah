import { useState, type FormEvent } from 'react';
import { BookOpen, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Dashboard, Field, Heading, Hero } from './components';
import { entryAmount, profileSchema, recordSchema, rm, today, type Business, type Profile, type RecordEntry, type TopicId } from './domain';
import { getLesson } from './lessons';

const recordLabels = { sale: 'Sale', purchase: 'Purchase', expense: 'Expense' } as const;

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
  return <form className="card panel" onSubmit={submit}>
    <h2>{profile ? 'Edit business profile' : 'Set up your business'}</h2><p>Start with one product. You can leave the unit cost blank while you work it out.</p>
    <div className="form-grid">
      <Field label="Business name"><input name="name" defaultValue={profile?.name} maxLength={100} required /></Field>
      <Field label="Business type"><select name="type" defaultValue={profile?.type ?? 'Food stall'}><option>Food stall</option><option>Market vendor</option><option>Home-based business</option><option>Other microbusiness</option></select></Field>
      <Field label="Primary product"><input name="product" defaultValue={profile?.product} maxLength={100} placeholder="e.g. Nasi Lemak" required /></Field>
      <Field label="Preferred language"><select name="language" defaultValue={profile?.language ?? 'English'}><option>English</option><option>Bahasa Melayu</option><option>Other</option></select></Field>
      <Field label="Selling price (RM)"><input type="number" name="price" defaultValue={profile?.price} step="0.01" min="0" max="1000000" required /></Field>
      <Field label="Estimated unit cost (RM)"><input type="number" name="cost" defaultValue={profile?.cost ?? ''} step="0.01" min="0" max="1000000" /></Field>
    </div>
    <p className="metric-note">Lessons and coaching are presented in English for this prototype.</p>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="actions"><button className="button primary">{profile ? 'Save business' : 'Create business'}</button><button type="button" className="button ghost" onClick={cancel}>Cancel</button></div>
  </form>;
}
function RecordForm({ profile, save, cancel }: { profile: Profile; save: (value: RecordEntry) => void; cancel: () => void }) {
  const [type, setType] = useState<RecordEntry['type']>('sale');
  const [error, setError] = useState('');
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
  return <form className="panel card" onSubmit={submit}>
    <h2>Add a record</h2>
    <div className="form-grid">
      <Field label="Record type"><select value={type} onChange={event => { setType(event.target.value as RecordEntry['type']); setError(''); }}><option value="sale">Product sale</option><option value="purchase">Ingredient purchase</option><option value="expense">Operating expense</option></select></Field>
      <Field label="Date"><input type="date" name="date" defaultValue={today()} required /></Field>
      <Field label="Category"><input key={type} name="category" maxLength={100} defaultValue={type === 'sale' ? 'Product sales' : type === 'purchase' ? 'Ingredients' : 'Stall costs'} required /></Field>
      <Field label="Description (optional)"><input name="description" maxLength={250} placeholder="e.g. Morning market" /></Field>
      {type === 'sale' ? <>
        <Field label={'Quantity · ' + profile.product}><input type="number" name="quantity" min="1" max="100000" step="1" required /></Field>
        <Field label="Unit price (RM)"><input type="number" name="unitPrice" min="0" max="1000000" step="0.01" defaultValue={profile.price} required /></Field>
      </> : <Field label="Amount (RM)"><input key={type} type="number" name="amount" min="0" max="1000000" step="0.01" required /></Field>}
      {type === 'purchase' && <label className="check-label"><input type="checkbox" name="associate" defaultChecked /> Associate with {profile.product}</label>}
    </div>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="actions"><button className="button primary">Save record</button><button type="button" className="button ghost" onClick={cancel}>Cancel</button></div>
  </form>;
}
type Props = {
  business: Business; recommended: TopicId; startGuide: () => void; tryDemo: () => void; resetDemo: () => void;
  saveProfile: (value: Profile) => void; addRecord: (value: RecordEntry) => void; deleteRecord: (id: string) => void;
  openLesson: (topic: TopicId) => void; guideAdvance?: () => void;
};
export function BusinessPage({ business, recommended, startGuide, tryDemo, resetDemo, saveProfile, addRecord, deleteRecord, openLesson, guideAdvance }: Props) {
  const [showProfile, setShowProfile] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const lesson = getLesson(recommended);
  return <>
    <Heading title="My Business" description={business.profile ? business.profile.name + ' · ' + business.profile.type : 'Your workspace for learning and running your business.'}>
      {business.profile && !guideAdvance && <div className="actions"><button className="button secondary" onClick={() => { setShowProfile(value => !value); setShowRecord(false); }}><Pencil size={16} /> Edit business</button><button className="button primary" onClick={() => { setShowRecord(value => !value); setShowProfile(false); }}><Plus size={18} /> Add record</button></div>}
    </Heading>
    {!guideAdvance && <Hero sample={business.sample} start={startGuide} tryDemo={tryDemo} onboarding={!business.profile ? () => setShowProfile(value => !value) : undefined} />}
    {!business.profile && !guideAdvance && <div className="actions demo-actions"><button className="button secondary" onClick={tryDemo}>Try Demo Business</button><span>Explore with fictional transactions.</span></div>}
    {showProfile && !guideAdvance && <ProfileForm profile={business.profile} save={value => { saveProfile(value); setShowProfile(false); }} cancel={() => setShowProfile(false)} />}
    {showRecord && business.profile && !guideAdvance && <RecordForm profile={business.profile} save={value => { addRecord(value); setShowRecord(false); }} cancel={() => setShowRecord(false)} />}
    <Dashboard business={business} />
    <section className="card panel next-panel">
      <div className="panel-heading"><span className="metric-icon"><BookOpen size={20} /></span><div><h2>Your next lesson · {lesson.title}</h2><p>{lesson.summary}</p></div></div>
      <button className="button primary" onClick={guideAdvance ?? (() => openLesson(lesson.id))}>Open lesson</button>
    </section>
    {!guideAdvance && business.profile && <section className="card panel">
      <div className="section-heading"><div><h2>Transactions</h2><p>{business.sample ? 'Fictional example records and your demo edits.' : 'Sales, ingredient purchases and operating expenses.'}</p></div>{business.sample && <button className="button ghost" onClick={() => setConfirmReset(value => !value)}><RotateCcw size={16} /> Reset Demo Data</button>}</div>
      {confirmReset && <div className="notice" role="alert"><p>Reset the fictional business, transactions, quizzes and goals?</p><div className="actions"><button className="button danger" onClick={() => { resetDemo(); setConfirmReset(false); }}>Confirm demo reset</button><button className="button ghost" onClick={() => setConfirmReset(false)}>Cancel</button></div></div>}
      {business.records.length === 0 ? <p className="empty-state">Add your first sale or business payment to get started.</p> :
        <div className="table-wrap"><table><thead><tr><th scope="col">Date</th><th scope="col">Record</th><th scope="col">Type</th><th scope="col">Amount</th><th scope="col">Action</th></tr></thead><tbody>
          {business.records.slice().sort((a, b) => b.date.localeCompare(a.date)).map(record => <tr key={record.id}>
            <td>{record.date}</td><td><strong>{record.category}</strong>{record.description && <small>{record.description}</small>}{record.type === 'sale' && <small>{record.quantity} × {rm(record.unitPrice)} · {record.product}</small>}{record.type === 'purchase' && record.product && <small>{record.product}</small>}</td>
            <td><span className="pill">{recordLabels[record.type]}</span></td><td>{rm(entryAmount(record))}</td>
            <td>{deleteId === record.id ? <div className="actions"><button className="button danger" onClick={() => { deleteRecord(record.id); setDeleteId(''); }}>Confirm deletion</button><button className="button ghost" onClick={() => setDeleteId('')}>Cancel</button></div> : <button className="button ghost" aria-label={'Delete ' + record.category} onClick={() => setDeleteId(record.id)}><Trash2 size={17} /></button>}</td>
          </tr>)}
        </tbody></table></div>}
    </section>}
  </>;
}
