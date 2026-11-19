import { useEffect, useRef, type ReactNode } from 'react';
import { BarChart3, BookOpen, Check, CircleHelp, FlaskConical, House, Plus, Sparkles, X } from 'lucide-react';
import { getLesson } from './lessons';
import type { CoachResult } from './coach-contract';

export const nav = [
  { id: 'business', label: 'My Business', short: 'Business', icon: House },
  { id: 'learning', label: 'Learning Path', short: 'Learn', icon: BookOpen },
  { id: 'practice', label: 'Practice Lab', short: 'Practice', icon: FlaskConical },
  { id: 'coach', label: 'AI Coach', short: 'Coach', icon: Sparkles },
  { id: 'progress', label: 'My Progress', short: 'Progress', icon: BarChart3 },
] as const;
export type Page = typeof nav[number]['id'];

export function Brand() {
  return <span className="brand"><span className="brand-mark"><BarChart3 size={20} /></span><span>Untung<span>Lah</span></span></span>;
}
export function PageIntro({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: ReactNode }) {
  return <div className="page-intro-row">
    <div className="page-intro"><span>{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>
    {children}
  </div>;
}
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, value / max * 100)) : 0;
  return <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><i style={{ width: percent + '%' }} /></div>;
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>('input, select, textarea, button:not(.modal-close)')?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close.current(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={panel} onMouseDown={event => event.stopPropagation()}>
      <button type="button" className="modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
      {children}
    </div>
  </div>;
}
export function CoachAnswer({ result, onGoal }: { result: CoachResult; onGoal: (title: string) => void }) {
  const { source, answer } = result;
  return <section className="coach-results" aria-live="polite">
    <span className={'coach-source ' + source}><Sparkles size={14} /> {source === 'qwen' ? 'Qwen AI explanation' : 'Demonstration explanation'}</span>
    {source === 'demo' && <p className="note">Live Qwen is unavailable for this request. You can retry.</p>}
    <h3>{answer.headline}</h3><p>{answer.explanation}</p>
    {answer.keyInsights.length > 0 && <ul>{answer.keyInsights.map((line, index) => <li key={index}>{line}</li>)}</ul>}
    <h4>Practical next steps</h4>
    <div className="recommendations">{answer.recommendations.map((line, index) => <div className="recommendation" key={index}><span>{line}</span><button className="button secondary small" onClick={() => onGoal(line)}><Plus size={15} /> Add goal</button></div>)}</div>
    <p className="suggested"><BookOpen size={16} /> Suggested lesson · {getLesson(answer.nextLearningTopic).title}</p>
    {(answer.assumptions.length > 0 || answer.limitations.length > 0) && <details><summary><CircleHelp size={16} /> Assumptions and limitations</summary><ul>{[...answer.assumptions, ...answer.limitations].map((line, index) => <li key={index}>{line}</li>)}</ul></details>}
  </section>;
}
const journey = ['Business', 'Lesson', 'Quiz', 'Practice', 'Explain', 'Goal'];
export function GuidedBar({ step, highest, select, exit }: { step: number; highest: number; select: (step: number) => void; exit: () => void }) {
  return <section className="guided-bar" aria-label="Guided demo progress">
    <div className="guided-head"><div><span className="eyebrow">GUIDED DEMO</span><strong>{highest >= journey.length ? 'Journey completed' : 'Step ' + (step + 1) + ' of ' + journey.length}</strong></div><button className="button ghost small" onClick={exit}>Exit demo guide</button></div>
    <div className="guided-steps">{journey.map((label, index) => <button type="button" key={label} className={'guided-step' + (index === step ? ' active' : '') + (index < highest ? ' done' : '')} aria-current={index === step ? 'step' : undefined} disabled={index > highest} onClick={() => select(index)}><span>{index < highest ? <Check size={13} /> : index + 1}</span>{label}</button>)}</div>
  </section>;
}
