import { useState, type FormEvent } from 'react';
import { BookOpen, Check, Plus, Target } from 'lucide-react';
import { Field, Heading } from './components';
import { today, topicId, validDate, type Business, type Goal, type TopicId } from './domain';
import { getLesson, lessons } from './lessons';

export type GoalDraft = { title: string; topic: TopicId };
type ProgressProps = {
  business: Business; completed: TopicId[]; suggestion: GoalDraft | null; save: (goal: Goal) => void;
  toggle: (id: string) => void; cancel: () => void; guided: boolean; finish: () => void;
};

function GoalForm({ suggestion, save, cancel }: { suggestion: GoalDraft; save: ProgressProps['save']; cancel: () => void }) {
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get('title') ?? '').trim();
    const topic = topicId.safeParse(data.get('topic'));
    const target = String(data.get('target') ?? '');
    if (!title || title.length > 180 || !topic.success || (target && !validDate.safeParse(target).success)) {
      setError('Enter a goal title, a related topic and a valid optional date.');
      return;
    }
    save({ id: crypto.randomUUID(), title, topic: topic.data, target, completed: false });
  }
  return <form className="panel card" onSubmit={submit}>
    <div className="panel-heading"><span className="metric-icon"><Target size={20} /></span><div><h2>Save an improvement goal</h2><p>Choose one small action you can complete.</p></div></div>
    <div className="form-grid">
      <Field label="Goal title"><input name="title" defaultValue={suggestion.title} maxLength={180} required /></Field>
      <Field label="Related topic"><select name="topic" defaultValue={suggestion.topic}>{lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></Field>
      <Field label="Target date (optional)"><input name="target" type="date" /></Field>
    </div>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="actions"><button className="button primary">Save goal</button><button type="button" className="button ghost" onClick={cancel}>Cancel</button></div>
  </form>;
}
export function ProgressPage({ business, completed, suggestion, save, toggle, cancel, guided, finish }: ProgressProps) {
  const [creating, setCreating] = useState(false);
  const done = business.goals.filter(goal => goal.completed).length;
  const form = suggestion ?? (creating ? { title: '', topic: 'growth' as const } : null);
  return <>
    <Heading title="My Progress" description="See what you’ve learned and track the actions you take.">
      {!form && <button className="button primary" onClick={() => setCreating(true)}><Plus size={18} /> New goal</button>}
    </Heading>
    {form && <GoalForm key={form.title + form.topic} suggestion={form} save={goal => { save(goal); setCreating(false); }} cancel={() => { cancel(); setCreating(false); }} />}
    {guided && !form && business.goals.length > 0 && <div className="notice"><h2>Put your learning into practice</h2><p>Your goal is saved. Try marking it complete, then finish the guided demo.</p><button className="button primary" onClick={finish}>Finish guided demo</button></div>}
    <div className="split-grid">
      <section className="card panel"><div className="panel-heading"><span className="metric-icon"><BookOpen size={20} /></span><div><h2>Learning progress</h2><p>{completed.length} of {lessons.length} topics completed</p></div></div>
        <progress className="progress-track" aria-label="Topics completed" value={completed.length} max={lessons.length} />
        <p>{business.attempts.length} quiz {business.attempts.length === 1 ? 'attempt' : 'attempts'} saved</p>
        {completed.map(id => <span key={id} className="pill"><Check size={14} /> {getLesson(id).title}</span>)}
      </section>
      <section className="card panel"><div className="panel-heading"><span className="metric-icon"><Target size={20} /></span><div><h2>Actions completed</h2><p>{done} of {business.goals.length} goals completed</p></div></div>
        <progress className="progress-track" aria-label="Goals completed" value={done} max={Math.max(1, business.goals.length)} />
      </section>
    </div>
    <section className="card panel"><h2>Improvement goals</h2>
      {business.goals.length === 0 ? <p className="empty-state">Save an action from AI Coach or create a goal here.</p> : <div className="goal-list">
        {business.goals.map(goal => <article className="goal-item" key={goal.id}>
          <div><strong>{goal.title}</strong><p>{getLesson(goal.topic).title}{goal.target && ' · Target ' + goal.target}{!goal.completed && goal.target && goal.target < today() && ' · Overdue'}</p></div>
          <span className={'pill' + (goal.completed ? ' success' : '')}>{goal.completed ? 'Completed' : 'In progress'}</span>
          <button className="button secondary" onClick={() => toggle(goal.id)}>{goal.completed ? 'Reopen goal' : 'Mark complete'}</button>
        </article>)}
      </div>}
    </section>
  </>;
}
