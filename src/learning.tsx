import { useState } from 'react';
import { BookOpen, Check, ClipboardList, Coins, LineChart, PiggyBank, RotateCcw, Target } from 'lucide-react';
import { Heading } from './components';
import { getLesson, lessons } from './lessons';
import { rm, scoreQuiz, unitEconomics, type Business, type TopicId } from './domain';

const icons = [ClipboardList, Coins, Target, LineChart, PiggyBank, BookOpen];
type LearningProps = {
  business: Business; selected: TopicId | null; recommended: TopicId; completed: TopicId[];
  showQuiz: boolean; select: (topic: TopicId | null) => void; openQuiz: () => void;
  record: (topic: TopicId, score: number, total: number) => void; advance?: () => void;
};
export function LearningPage({ business, selected, recommended, completed, showQuiz, select, openQuiz, record, advance }: LearningProps) {
  if (!selected) return <>
    <Heading title="Learning Path" description="Build six practical skills, one short lesson at a time." />
    <div className="progress-summary card panel"><div><h2>{completed.length} of {lessons.length} topics completed</h2><p>Complete a topic by passing its quick quiz.</p></div><progress className="progress-track" aria-label="Learning topics completed" value={completed.length} max={lessons.length} /></div>
    <div className="lesson-grid">{lessons.map((lesson, index) => {
      const Icon = icons[index];
      const done = completed.includes(lesson.id);
      return <article className="lesson-card card panel" key={lesson.id}>
        <div className="section-heading"><span className="metric-icon"><Icon size={20} /></span>{done ? <span className="pill"><Check size={14} /> Completed</span> : lesson.id === recommended ? <span className="pill">Recommended</span> : null}</div>
        <h2>{lesson.title}</h2><p>{lesson.summary}</p><button className="button secondary" onClick={() => select(lesson.id)}>{done ? 'Review lesson' : 'Open lesson'}</button>
      </article>;
    })}</div>
  </>;
  const lesson = getLesson(selected);
  const profile = business.profile;
  const unit = profile ? unitEconomics(profile.price, profile.cost) : null;
  return <>
    <Heading title={lesson.title} description={showQuiz ? 'Quick quiz' : lesson.summary}>
      {!advance && <button className="button secondary" onClick={() => select(null)}>All lessons</button>}
    </Heading>
    {showQuiz ? <Quiz key={lesson.id} id={lesson.id} record={record} next={advance} back={() => select(selected)} /> :
      <article className="card panel lesson-reader">
        <span className="pill"><BookOpen size={15} /> Short lesson</span>
        <h2>What you’ll learn</h2><p>{lesson.objective}</p>
        <h2>How it works</h2><p>{lesson.content}</p>
        <div className="notice"><h3>Malaysian example</h3><p>{lesson.example}</p></div>
        {profile && profile.cost !== null && unit?.contribution != null && ['cost', 'pricing', 'profit'].includes(selected) && <div className="notice"><h3>{business.sample ? 'Using the sample business' : 'Using your numbers'}</h3>
          <p>{profile.product} sells for {rm(profile.price)} and costs about {rm(profile.cost)} to make. Estimated contribution before other operating expenses is {rm(unit.contribution)} per unit.</p>
        </div>}
        <button className="button primary" onClick={() => { openQuiz(); advance?.(); }}>Take quick quiz</button>
      </article>}
  </>;
}

function Quiz({ id, record, next, back }: { id: TopicId; record: LearningProps['record']; next?: () => void; back: () => void }) {
  const lesson = getLesson(id);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const total = lesson.questions.length;
  const score = scoreQuiz(lesson.questions, answers);
  const passed = score >= Math.ceil(total * 2 / 3);
  const [reviewIndex, setReviewIndex] = useState(0);
  const visibleQuestion = lesson.questions[reviewIndex];
  function submit(answer: number) {
    if (reviewIndex < answers.length) return;
    const updated = [...answers, answer];
    setAnswers(updated);
    if (updated.length === total) record(id, scoreQuiz(lesson.questions, updated), total);
  }
  if (finished) return <section className="card panel quiz-card">
    <span className="pill">{passed ? 'Topic completed' : 'Practice round'}</span>
    <h2>You scored {score} of {total}</h2><p>{passed ? 'You can apply this idea using a business example.' : 'Review the explanations and try again. Answer at least two-thirds correctly to complete the topic.'}</p>
    <div className="actions">
      {passed && next && <button className="button primary" onClick={next}>Open pricing simulation</button>}
      <button className="button secondary" onClick={() => { setAnswers([]); setReviewIndex(0); setFinished(false); }}><RotateCcw size={16} /> Retry quiz</button>
      {!next && <button className="button ghost" onClick={back}>Back to lesson</button>}
    </div>
  </section>;
  return <section className="card panel quiz-card">
    <span className="pill">Question {reviewIndex + 1} of {total}</span>
    <h2>{visibleQuestion.prompt}</h2>
    <div className="quiz-options">{visibleQuestion.options.map((option, optionIndex) => {
      const isAnswered = answers.length > reviewIndex;
      const feedback = isAnswered && optionIndex === visibleQuestion.correct ? ' correct' : isAnswered && optionIndex === answers[reviewIndex] ? ' wrong' : '';
      return <button key={option} type="button" className={'quiz-option' + feedback} onClick={() => submit(optionIndex)} disabled={isAnswered}><span>{'ABCD'[optionIndex]}</span>{option}</button>;
    })}</div>
    {answers.length > reviewIndex && <div className="notice" aria-live="polite"><strong>{answers[reviewIndex] === visibleQuestion.correct ? 'Correct' : 'Here’s how it works'}</strong><p>{visibleQuestion.explanation}</p></div>}
    {answers.length > reviewIndex && <button className="button primary" onClick={() => {
      if (reviewIndex === total - 1) setFinished(true);
      else setReviewIndex(index => index + 1);
    }}>{reviewIndex === total - 1 ? 'See score' : 'Next question'}</button>}
  </section>;
}
