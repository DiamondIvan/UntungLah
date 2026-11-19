import { useState, type FormEvent } from 'react';
import { BookOpen, CalendarDays, Check, CircleCheck, Plus, Target } from 'lucide-react';
import { Bar, Field, Modal, PageIntro } from './components';
import { activity, today, topicId, validDate, type Business, type Goal, type TopicId } from './domain';
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
  return <Modal title="Save an improvement goal" onClose={cancel}>
    <form onSubmit={submit}>
      <span className="modal-icon goal"><Target size={21} /></span>
      <span className="eyebrow">IMPROVEMENT PLAN</span>
      <h2>Save an improvement goal</h2>
      <p className="modal-lead">Choose one small action you can complete.</p>
      <div className="form-grid">
        <Field label="Goal title"><input name="title" defaultValue={suggestion.title} maxLength={180} required /></Field>
        <Field label="Related topic"><select name="topic" defaultValue={suggestion.topic}>{lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></Field>
        <Field label="Target date (optional)"><input name="target" type="date" min={today()} /></Field>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="actions"><button className="button primary">Save goal</button><button type="button" className="button ghost" onClick={cancel}>Cancel</button></div>
    </form>
  </Modal>;
}

export function ProgressPage({ business, completed, suggestion, save, toggle, cancel, guided, finish }: ProgressProps) {
  const [creating, setCreating] = useState(false);
  const stats = activity(business);
  const form = suggestion ?? (creating ? { title: '', topic: 'growth' as const } : null);
  const percent = Math.round(completed.length / lessons.length * 100);
  const circumference = 2 * Math.PI * 50;
  const goals = business.goals.slice().sort((a, b) => Number(a.completed) - Number(b.completed));
  return <>
    <PageIntro eyebrow="SMALL STEPS, REAL PROGRESS" title="My Progress" text="See what you’ve learned and track the actions you take.">
      <button className="button primary" onClick={() => setCreating(true)}><Plus size={18} /> New goal</button>
    </PageIntro>
    {guided && !form && business.goals.length > 0 && <div className="notice highlight"><strong>Put your learning into practice</strong><p>Your goal is saved. Try marking it complete, then finish the guided demo.</p><button className="button primary" onClick={finish}>Finish guided demo</button></div>}
    <section className="progress-hero">
      <div className="progress-ring" role="img" aria-label={percent + '% of the learning path complete'}>
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" /><circle className="filled" cx="60" cy="60" r="50" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} /></svg>
        <div><strong>{percent}%</strong><span>Path complete</span></div>
      </div>
      <div>
        <span className="eyebrow">YOUR JOURNEY</span>
        <h2>{completed.length === 0 ? 'Every strong business starts with one habit.' : 'You’re building a stronger money habit.'}</h2>
        <p>You have completed {completed.length} of {lessons.length} topics and recorded your business on {stats.recordDays} {stats.recordDays === 1 ? 'day' : 'days'}. Consistent records make every insight more useful.</p>
        <div className="pill-row">{completed.map(id => <span key={id} className="pill light"><Check size={14} /> {getLesson(id).title}</span>)}</div>
      </div>
    </section>
    <section className="progress-cards">
      <div className="panel"><span className="stat-icon teal"><BookOpen size={19} /></span><strong>{completed.length}</strong><p>Topics completed</p><small>{completed.length} of {lessons.length} topics completed</small></div>
      <div className="panel"><span className="stat-icon coral"><CircleCheck size={19} /></span><strong>{stats.quizAverage === null ? '—' : stats.quizAverage + '%'}</strong><p>Quiz average</p><small>{business.attempts.length} quiz {business.attempts.length === 1 ? 'attempt' : 'attempts'} saved</small></div>
      <div className="panel"><span className="stat-icon yellow"><CalendarDays size={19} /></span><strong>{stats.recordDays}</strong><p>Days recorded</p><small>Dates with at least one record</small></div>
      <div className="panel"><span className="stat-icon navy"><Target size={19} /></span><strong>{stats.goalsDone}</strong><p>Goals achieved</p><small>{stats.goalsDone} of {stats.goalsTotal} goals completed</small></div>
    </section>
    <section className="panel goals-panel">
      <div className="panel-title"><div><span className="eyebrow">IMPROVEMENT PLAN</span><h3>Improvement goals</h3></div></div>
      <Bar value={stats.goalsDone} max={Math.max(1, stats.goalsTotal)} label="Goals completed" />
      {goals.length === 0 ? <p className="empty-state">Save an action from AI Coach or Practice Lab, or create a goal here.</p> : <div className="goal-list">
        {goals.map(goal => <article className={'goal-item' + (goal.completed ? ' done' : '')} key={goal.id}>
          <span className="goal-icon"><Target size={19} /></span>
          <div><strong>{goal.title}</strong><p>{getLesson(goal.topic).title}{goal.target && ' · Target ' + goal.target}{!goal.completed && goal.target && goal.target < today() && ' · Overdue'}</p></div>
          <span className={'pill' + (goal.completed ? ' success' : '')}>{goal.completed ? 'Completed' : 'In progress'}</span>
          <button className={'button ' + (goal.completed ? 'ghost' : 'secondary')} onClick={() => toggle(goal.id)}>{goal.completed ? 'Reopen goal' : 'Mark complete'}</button>
        </article>)}
      </div>}
    </section>
    {form && <GoalForm key={form.title + form.topic} suggestion={form} save={goal => { save(goal); setCreating(false); }} cancel={() => { cancel(); setCreating(false); }} />}
  </>;
}
