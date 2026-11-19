import { useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { CoachAnswer, Field, Heading } from './components';
import type { CoachRequest } from './coach-contract';
import { useCoach } from './use-coach';
import type { GoalDraft } from './progress';

export function CoachPage({ context, onGoal }: { context: CoachRequest['business']; onGoal: (goal: GoalDraft) => void }) {
  const [question, setQuestion] = useState('');
  const { busy, latest, ask } = useCoach();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim()) void ask({ task: 'question', business: context, question: question.trim() });
  }
  return <>
    <Heading title="AI Coach" description="Understand your numbers and choose a practical next step." />
    <form className="panel card" onSubmit={submit}>
      <div className="panel-heading"><span className="metric-icon"><Sparkles size={20} /></span><div><h2>Ask about your business</h2><p>The coach uses recorded totals and learning progress when available.</p></div></div>
      <Field label="Your question"><textarea value={question} onChange={event => setQuestion(event.target.value)} maxLength={500} rows={4} placeholder="What should I track before changing my price?" required /></Field>
      <p className="metric-note">Questions and a summary of your numbers are sent to Qwen when connected. Keep personal details out of your question.</p>
      <div className="actions">
        <button className="button primary" disabled={busy || !question.trim()}><Sparkles size={17} /> {busy ? 'Preparing answer…' : 'Ask AI Coach'}</button>
        <button type="button" className="button secondary" disabled={busy} onClick={() => void ask({ task: 'learning', business: context })}>Recommend my next lesson</button>
      </div>
    </form>
    {latest?.error && <p className="error" role="alert">{latest.error}</p>}
    {latest?.result && <CoachAnswer result={latest.result} onGoal={title => onGoal({ title, topic: latest.result!.answer.nextLearningTopic })} />}
  </>;
}
