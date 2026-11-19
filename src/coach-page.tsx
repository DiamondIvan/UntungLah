import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, Send, Sparkles } from 'lucide-react';
import { CoachAnswer, PageIntro } from './components';
import type { CoachRequest, CoachResult } from './coach-contract';
import { useCoach } from './use-coach';
import type { GoalDraft } from './progress';

type Message = { id: number; from: 'user'; text: string } | { id: number; from: 'ai'; result?: CoachResult; error?: string };
const prompts = ['Am I making enough profit?', 'How should I price my product?', 'Explain my ingredient spending', 'What should I track before changing my price?'];

export function CoachPage({ context, businessName, onGoal }: { context: CoachRequest['business']; businessName?: string; onGoal: (goal: GoalDraft) => void }) {
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState<Message[]>([]);
  const { busy, ask } = useCoach();
  const nextId = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (thread.length) end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [thread.length, busy]);

  async function send(request: CoachRequest, label: string) {
    if (busy) return;
    setThread(previous => [...previous, { id: nextId.current++, from: 'user', text: label }]);
    const outcome = await ask(request);
    if (outcome) setThread(previous => [...previous, { id: nextId.current++, from: 'ai', result: outcome.result, error: outcome.error }]);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    setQuestion('');
    void send({ task: 'question', business: context, question: text }, text);
  }
  return <div className="coach-page">
    <PageIntro eyebrow="YOUR BUSINESS, EXPLAINED" title="AI Coach" text="Simple guidance based on your recorded totals and learning progress. Figures are calculated by the app, not the AI." />
    <div className="coach-layout">
      <section className="chat-card">
        <div className="chat-head"><span className="coach-spark"><Sparkles size={19} /></span><div><strong>Untung Coach</strong><small>Each answer is labelled Qwen AI or demonstration</small></div></div>
        <div className="messages">
          <div className="message ai"><span><Sparkles size={15} /></span><div className="bubble"><p>Hi{businessName ? ', ' + businessName : ''}. I can explain your records, lessons or practice results in simple language. What would you like to understand?</p></div></div>
          {thread.map(message => message.from === 'user'
            ? <div key={message.id} className="message user"><div className="bubble"><p>{message.text}</p></div></div>
            : <div key={message.id} className="message ai"><span><Sparkles size={15} /></span><div className="bubble wide">
              {message.result ? <CoachAnswer result={message.result} onGoal={title => onGoal({ title, topic: message.result!.answer.nextLearningTopic })} /> : <p className="error" role="alert">{message.error}</p>}
            </div></div>)}
          {busy && <div className="message ai"><span><Sparkles size={15} /></span><div className="bubble"><p className="typing">Preparing answer…</p></div></div>}
          <div ref={end} />
        </div>
        <form onSubmit={submit}>
          <input value={question} onChange={event => setQuestion(event.target.value)} maxLength={500} placeholder="Ask about your business…" aria-label="Your question" />
          <button className="send" aria-label="Ask AI Coach" disabled={busy || !question.trim()}><Send size={18} /></button>
        </form>
        <small className="ai-note">Each question is answered on its own. Your question and a summary of your totals are sent to Qwen when connected, so keep personal details out. Suggestions only.</small>
      </section>
      <aside className="prompt-panel">
        <span className="eyebrow">TRY ASKING</span>
        {prompts.map(text => <button key={text} onClick={() => setQuestion(text)}>{text}<ArrowRight size={15} /></button>)}
        <button className="button secondary wide" disabled={busy} onClick={() => void send({ task: 'learning', business: context }, 'Recommend my next lesson')}><BookOpen size={16} /> Recommend my next lesson</button>
      </aside>
    </div>
  </div>;
}
