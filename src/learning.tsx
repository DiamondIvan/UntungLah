import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, BookOpen, Check, CircleCheck, Clock, FlaskConical, Lightbulb, RotateCcw, Store, Target, UserRound } from 'lucide-react';
import { Bar, PageIntro } from './components';
import { exampleBusiness, getLesson, lessons, type Block } from './lessons';
import { LessonTool } from './lesson-tools';
import { operatingEstimate, rm, scoreQuiz, snapshot, unitEconomics, type Business, type LessonStep, type TopicId } from './domain';

export type Step = 'learn' | 'check' | 'try' | 'apply';
const colors = ['#0b6b69', '#ee735f', '#e19a35', '#538a81', '#8074a8', '#3b566b'];
const stepLabels: { id: Step; label: string; short: string }[] = [
  { id: 'learn', label: 'Learn', short: 'Learn' }, { id: 'check', label: 'Check your knowledge', short: 'Check' },
  { id: 'try', label: 'Try it yourself', short: 'Try it' }, { id: 'apply', label: 'Apply to your business', short: 'Apply' },
];
type LearningProps = {
  business: Business; selected: TopicId | null; recommended: TopicId; completed: TopicId[];
  step: Step; setStep: (step: Step) => void; select: (topic: TopicId | null) => void;
  record: (topic: TopicId, score: number, total: number) => void; markStep: (topic: TopicId, step: LessonStep) => void;
  onApply: (title: string, topic: TopicId) => void; onSaveCost: (cost: number) => void; practise: () => void; advance?: () => void;
};

export function stepStatus(business: Business, completed: TopicId[], id: TopicId): Record<Step, boolean> {
  return {
    learn: business.steps.learned.includes(id), check: completed.includes(id),
    try: business.steps.practised.includes(id), apply: business.goals.some(goal => goal.topic === id),
  };
}

/** A short, calculated connection between the lesson and the workspace's own figures. */
function personal(id: TopicId, business: Business): { title: string; text: string } | null {
  const profile = business.profile;
  if (!profile) return null;
  const title = business.sample ? 'Using the sample business' : 'Using your numbers';
  const unit = unitEconomics(profile.price, profile.cost);
  const totals = snapshot(business.records);
  const counts = { sale: 0, purchase: 0, expense: 0 };
  for (const record of business.records) counts[record.type] += 1;
  const days = new Set(business.records.map(record => record.date)).size;
  switch (id) {
    case 'records':
      return { title, text: business.records.length ? `You have recorded ${counts.sale} ${counts.sale === 1 ? 'sale' : 'sales'}, ${counts.purchase} ${counts.purchase === 1 ? 'purchase' : 'purchases'} and ${counts.expense} ${counts.expense === 1 ? 'expense' : 'expenses'} across ${days} ${days === 1 ? 'day' : 'days'}.` : 'You have not recorded anything yet. Add today’s sales and spending in My Business.' };
    case 'cost':
      return { title, text: profile.cost === null ? `You have not set a unit cost for ${profile.product} yet. Use the calculator in “Try it yourself” to work it out.` : `Your estimated cost per ${profile.product} is ${rm(profile.cost)}. Check that it includes packaging and a share of gas.` };
    case 'pricing':
      return unit.contribution === null ? { title, text: `Add an estimated unit cost for ${profile.product} to see your gross profit per unit.` }
        : { title, text: `${profile.product} sells for ${rm(profile.price)} and costs about ${rm(profile.cost!)} to make. Gross profit is ${rm(unit.contribution)} per unit${unit.margin === null ? '' : ', a ' + unit.margin.toFixed(1) + '% margin'}, before other operating expenses.` };
    case 'profit': {
      const estimate = operatingEstimate(business);
      return estimate ? { title, text: `From your records: ${rm(estimate.revenue)} revenue from ${estimate.units} ${profile.product} sold, about ${rm(estimate.goodsSold)} cost of goods and ${rm(estimate.expenses)} of operating expenses. Estimated operating profit: ${rm(estimate.operating)}.` }
        : { title, text: `Record a sale of ${profile.product} and set its unit cost to see an estimated operating profit from your own figures.` };
    }
    case 'cash':
      return business.records.length ? { title, text: `Your records show ${rm(totals.revenue)} received and ${rm(totals.outflows)} paid out, a recorded cash surplus of ${rm(totals.surplus)}. Opening cash is not recorded, so add it in the planner.` } : null;
    case 'growth':
      return unit.contribution === null ? null : { title, text: `Each extra ${profile.product} you sell leaves about ${rm(unit.contribution)} before operating expenses. Use this to test whether new equipment would pay for itself.` };
  }
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map((block, index) => {
    const heading = 'heading' in block && block.heading ? <h3>{block.heading}</h3> : null;
    switch (block.kind) {
      case 'text': return <div className="block" key={index}>{heading}<p>{block.text}</p></div>;
      case 'list': return <div className="block" key={index}>{heading}{block.intro && <p>{block.intro}</p>}<ul>{block.items.map(item => <li key={item}>{item}</li>)}</ul></div>;
      case 'table': return <div className="block" key={index}>{heading}{block.intro && <p>{block.intro}</p>}
        <div className="table-scroll"><table className="lesson-table"><thead><tr>{block.table.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
          <tbody>{block.table.rows.map(row => <tr key={row.join()}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th scope="row" key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
        {block.after && <p>{block.after}</p>}</div>;
      case 'formula': return <div className="block" key={index}>{heading}<div className="formula">{block.formula}</div>{block.note && <p className="note">{block.note}</p>}</div>;
      case 'callout': return <div className={'example ' + (block.tone === 'warning' ? 'warn' : '')} key={index}>{block.tone === 'warning' ? <AlertTriangle size={18} /> : <Lightbulb size={18} />}<div><strong>{block.title}</strong><p>{block.text}</p></div></div>;
      case 'highlight': return <div className="lesson-highlight" key={index}><span>{block.label}</span><strong>{block.value}</strong><p>{block.note}</p></div>;
    }
  })}</>;
}

export function LearningPage(props: LearningProps) {
  const { business, selected, recommended, completed, step, setStep, select, record, markStep, onApply, onSaveCost, practise, advance } = props;
  const current = selected ?? recommended;
  const lesson = getLesson(current);
  const index = lessons.findIndex(item => item.id === current);
  const status = stepStatus(business, completed, current);
  const doneCount = Object.values(status).filter(Boolean).length;
  const mine = personal(current, business);
  const detail = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!selected || advance || window.innerWidth >= 1080) return;
    const frame = requestAnimationFrame(() => detail.current?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [selected, step, advance]);
  const next = lessons.slice(index + 1).concat(lessons.slice(0, index)).find(item => !completed.includes(item.id));
  const tag = completed.includes(current) ? 'COMPLETED · REVIEW ANY TIME' : current === recommended ? 'RECOMMENDED FOR YOU' : 'LESSON ' + String(index + 1).padStart(2, '0');

  return <>
    <PageIntro eyebrow="LEARN IN SMALL STEPS" title="Your learning path" text="Six practical money skills. Each lesson has four steps: learn, check, try it yourself, and apply it to your business." />
    <div className={'learn-layout' + (advance ? ' guided' : '')}>
      {!advance && <section className="lesson-list" aria-label="Learning topics">
        <div className="list-title"><h2>Six skills for a stronger business</h2><span>{completed.length} of {lessons.length} completed</span></div>
        <Bar value={completed.length} max={lessons.length} label="Learning topics completed" />
        {lessons.map((item, position) => {
          const done = completed.includes(item.id);
          const steps = Object.values(stepStatus(business, completed, item.id)).filter(Boolean).length;
          return <button key={item.id} className={'lesson-row' + (current === item.id ? ' selected' : '')} aria-current={current === item.id ? 'true' : undefined} onClick={() => select(item.id)}>
            <span className="lesson-number" style={{ backgroundColor: colors[position] }}>{String(position + 1).padStart(2, '0')}</span>
            <span className="lesson-info"><strong>{item.title}</strong><small>{item.summary} · {steps} of 4 steps</small><i><b style={{ width: steps * 25 + '%', backgroundColor: colors[position] }} /></i></span>
            <span className="lesson-status">{done ? <><Check size={15} /><span className="sr-only">Completed</span></> : item.id === recommended ? 'Next' : <ArrowRight size={15} />}</span>
          </button>;
        })}
        <div className="example-business"><Store size={18} /><div><strong>Meet our example business</strong><p>{exampleBusiness.name}: {exampleBusiness.description.toLowerCase()} Lessons use its figures unless your own are available.</p></div></div>
      </section>}
      <section className="lesson-detail" ref={detail}>
        <span className="detail-tag">{tag}</span>
        <p className="detail-meta">Lesson {String(index + 1).padStart(2, '0')} · <Clock size={13} /> About {lesson.minutes} min</p>
        <h2>{lesson.title}</h2>
        <p className="lesson-headline">{lesson.headline}</p>
        {!advance && <>
          <div className="journey-line"><span>Your learning journey · {doneCount} of 4 steps completed</span><Bar value={doneCount} max={4} label="Lesson steps completed" /></div>
          <div className="stepper" role="tablist" aria-label="Lesson steps">{stepLabels.map((item, position) => <button key={item.id} role="tab" aria-selected={step === item.id} className={(step === item.id ? 'active' : '') + (status[item.id] ? ' done' : '')} onClick={() => setStep(item.id)}>
            <span>{status[item.id] ? <Check size={13} /> : position + 1}</span><b className="step-long">{item.label}</b><b className="step-short" aria-hidden="true">{item.short}</b>
          </button>)}</div>
        </>}

        {step === 'learn' && <div className="lesson-body">
          <div className="objectives"><strong>By the end of this lesson you can:</strong><ul>{lesson.objectives.map(objective => <li key={objective}>{objective}</li>)}</ul></div>
          <Blocks blocks={lesson.learn} />
          <div className="worked"><span className="eyebrow">EXAMPLE · {exampleBusiness.name.toUpperCase()}</span><p>{lesson.example.intro}</p><Blocks blocks={lesson.example.blocks} /></div>
          {mine && <div className="example yours"><UserRound size={18} /><div><strong>{mine.title}</strong><p>{mine.text}</p></div></div>}
          <button className="button primary" onClick={() => { markStep(current, 'learned'); if (advance) advance(); else setStep('check'); }}>Take quick quiz</button>
        </div>}

        {step === 'check' && <Quiz key={current} id={current} record={record} next={advance} onPassed={() => setStep('try')} back={() => setStep('learn')} />}

        {step === 'try' && <div className="lesson-body">
          <div className="try-head"><FlaskConical size={20} /><div><h3>{lesson.practice.title}</h3><p>{lesson.practice.intro}</p></div></div>
          <LessonTool topic={current} business={business} onPractise={() => markStep(current, 'practised')} onSaveCost={onSaveCost} />
          <div className="actions step-nav">
            <button className="button primary" onClick={() => setStep('apply')}>Next: apply to your business</button>
            {(current === 'pricing' || current === 'cost') && <button className="text-button" onClick={practise}>Open the full Practice Lab <ArrowRight size={16} /></button>}
          </div>
        </div>}

        {step === 'apply' && <div className="lesson-body">
          <div className="task-card"><span className="goal-icon"><Target size={20} /></span><div><span className="eyebrow">YOUR BUSINESS TASK</span><p className="task">{lesson.task}</p></div></div>
          {status.apply
            ? <p className="tool-ok"><CircleCheck size={16} /> You have a goal for this topic. Track it in My Progress.</p>
            : <button className="button primary" onClick={() => onApply(lesson.task, current)}><Target size={16} /> Save as my goal</button>}
          {doneCount === 4 ? <div className="lesson-complete" role="status">
            <CircleCheck size={26} /><div><strong>Lesson completed</strong><p>You learned it, checked it, tried it and planned how to use it.</p></div>
            {next && <button className="button amber" onClick={() => select(next.id)}>Next lesson: {next.title} <ArrowRight size={16} /></button>}
          </div> : <p className="note">{4 - doneCount} {4 - doneCount === 1 ? 'step' : 'steps'} left in this lesson. Completed steps are ticked above.</p>}
        </div>}
      </section>
    </div>
  </>;
}

function Quiz({ id, record, next, back, onPassed }: { id: TopicId; record: LearningProps['record']; next?: () => void; back: () => void; onPassed: () => void }) {
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
  if (finished) return <div className="quiz-card">
    <span className="detail-tag">{passed ? 'TOPIC COMPLETED' : 'PRACTICE ROUND'}</span>
    <h2>You scored {score} of {total}</h2>
    <p className="detail-copy">{passed ? 'Well done. Now try the idea with real numbers.' : 'Review the explanations and try again. Answer at least two-thirds correctly to complete the topic.'}</p>
    <div className="actions">
      {passed && next && <button className="button primary" onClick={next}>Open pricing simulation</button>}
      {passed && !next && <button className="button primary" onClick={onPassed}>Next: try it yourself</button>}
      <button className="button secondary" onClick={() => { setAnswers([]); setReviewIndex(0); setFinished(false); }}><RotateCcw size={16} /> Retry quiz</button>
      {!next && <button className="button ghost" onClick={back}><BookOpen size={16} /> Back to lesson</button>}
    </div>
  </div>;
  const isAnswered = answers.length > reviewIndex;
  return <div className="quiz-card">
    <span className="detail-tag coral">QUICK CHECK · QUESTION {reviewIndex + 1} OF {total}</span>
    <Bar value={answers.length} max={total} label="Questions answered" />
    <h2>{visibleQuestion.prompt}</h2>
    <div className="quiz-options">{visibleQuestion.options.map((option, optionIndex) => {
      const feedback = isAnswered && optionIndex === visibleQuestion.correct ? ' correct' : isAnswered && optionIndex === answers[reviewIndex] ? ' wrong' : '';
      return <button key={option} type="button" className={'quiz-option' + feedback} onClick={() => submit(optionIndex)} disabled={isAnswered}><span>{'ABCD'[optionIndex]}</span>{option}</button>;
    })}</div>
    {isAnswered && <div className={'feedback' + (answers[reviewIndex] === visibleQuestion.correct ? ' good' : '')} aria-live="polite"><strong>{answers[reviewIndex] === visibleQuestion.correct ? 'Correct' : 'Here’s how it works'}</strong><p>{visibleQuestion.explanation}</p></div>}
    {isAnswered && <button className="button primary" onClick={() => {
      if (reviewIndex === total - 1) setFinished(true);
      else setReviewIndex(position => position + 1);
    }}>{reviewIndex === total - 1 ? 'See score' : 'Next question'}</button>}
  </div>;
}
