import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FlaskConical, Lightbulb, Store } from 'lucide-react';
import { Brand, nav, GuidedBar, type Page } from './components';
import { BusinessPage } from './business';
import { LearningPage, type Step } from './learning';
import { PracticePage } from './practice';
import { CoachPage } from './coach-page';
import { ProgressPage, type GoalDraft } from './progress';
import { demoBusiness, readBusiness, saveBusiness, snapshot, today, topicIds, unitEconomics, type Business, type LessonStep, type TopicId } from './domain';
import './styles.css';

type Guide = { step: number; highest: number };
const demoKey = 'untunglah.demo.v1';
const viewKey = 'untunglah.view.v1';
const guidedPages: Page[] = ['business', 'learning', 'learning', 'practice', 'practice', 'progress'];

function readLocal(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
const storageReader = { getItem: readLocal };
function readView(): { sample: boolean; guide: Guide | null } {
  try {
    const saved = JSON.parse(readLocal(viewKey) ?? '{}');
    const sample = saved.sample === true;
    const guide = saved.guide;
    if (sample && Number.isInteger(guide?.step) && Number.isInteger(guide?.highest) && guide.step >= 0 && guide.step <= 5 && guide.highest >= guide.step && guide.highest <= 6) {
      return { sample, guide };
    }
    return { sample, guide: null };
  } catch {
    return { sample: false, guide: null };
  }
}
function recommend(business: Business, completed: TopicId[]): TopicId {
  if (business.sample && !completed.includes('pricing')) return 'pricing';
  if (!business.records.length && !completed.includes('records')) return 'records';
  if (business.profile?.cost == null && !completed.includes('cost')) return 'cost';
  if (business.profile && !completed.includes('pricing')) return 'pricing';
  const last = business.attempts.at(-1);
  if (last && !completed.includes(last.topic)) return last.topic;
  return topicIds.find(id => !completed.includes(id)) ?? 'growth';
}
function App() {
  const [view, setView] = useState(readView);
  const [personal, setPersonal] = useState(() => readBusiness(storageReader));
  const [demo, setDemo] = useState(() => {
    const stored = readBusiness(storageReader, demoKey);
    return stored.sample ? stored : demoBusiness();
  });
  const [page, setPage] = useState<Page>('business');
  const [topic, setTopic] = useState<TopicId | null>(null);
  const [lessonStep, setLessonStep] = useState<Step>('learn');
  const [goalDraft, setGoalDraft] = useState<GoalDraft | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [guideComplete, setGuideComplete] = useState(false);
  const { sample, guide } = view;
  const business = sample ? demo : personal;
  const activePage = guide ? guidedPages[guide.step] : page;
  const completed = topicIds.filter(id => business.attempts.some(attempt => attempt.topic === id && attempt.score >= Math.ceil(attempt.total * 2 / 3)));
  const recommended = guide ? 'pricing' : recommend(business, completed);
  const totals = snapshot(business.records);
  const context = business.profile ? {
    type: business.profile.type, product: business.profile.product, revenue: totals.revenue,
    outflows: totals.outflows, surplus: totals.surplus, completed,
    unitContribution: unitEconomics(business.profile.price, business.profile.cost).contribution,
  } : undefined;

  useEffect(() => {
    try {
      saveBusiness(localStorage, personal);
      saveBusiness(localStorage, demo, demoKey);
      localStorage.setItem(viewKey, JSON.stringify(view));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [personal, demo, view]);

  useEffect(() => { window.scrollTo(0, 0); }, [activePage, guide?.step, topic, lessonStep]);

  function update(transform: (previous: Business) => Business) {
    (sample ? setDemo : setPersonal)(transform);
  }
  function goTo(next: Page) {
    setView(previous => ({ ...previous, guide: null }));
    setPage(next);
    setGuideComplete(false);
    if (next === 'learning') { setTopic(null); setLessonStep('learn'); }
  }
  function selectTopic(next: TopicId | null) {
    setTopic(next);
    setLessonStep('learn');
    setPage('learning');
  }
  function startGuide() {
    setGoalDraft(null);
    setGuideComplete(false);
    setView({ sample: true, guide: { step: 0, highest: 0 } });
  }
  function changeView(nextSample: boolean) {
    setView({ sample: nextSample, guide: null });
    setGoalDraft(null);
    setGuideComplete(false);
    setPage('business');
  }
  function setStep(step: number) {
    setView(previous => ({ ...previous, guide: { step, highest: Math.max(previous.guide?.highest ?? 0, step) } }));
  }
  function saveSuggestion(goal: GoalDraft) {
    setGoalDraft({ ...goal, title: goal.title.length <= 180 ? goal.title : goal.title.slice(0, 177).trimEnd() + '…' });
    if (guide) setStep(5);
    else goTo('progress');
  }

  const dateLabel = new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const initials = business.profile ? business.profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]!.toUpperCase()).join('') : '';
  const markStep = (id: TopicId, step: LessonStep) => update(previous => previous.steps[step].includes(id) ? previous : { ...previous, steps: { ...previous.steps, [step]: [...previous.steps[step], id] } });
  const toggleGoal = (id: string) => update(previous => ({ ...previous, goals: previous.goals.map(goal => goal.id === id ? { ...goal, completed: !goal.completed } : goal) }));

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand-button" onClick={() => goTo('business')} aria-label="UntungLah home"><Brand /></button>
      <nav className="nav-list" aria-label="Main navigation">
        {nav.map(({ id, label, short, icon: Icon }) => <button className={'nav-item' + (activePage === id ? ' active' : '')} aria-current={activePage === id ? 'page' : undefined} key={id} onClick={() => goTo(id)}>
          <span className="nav-icon"><Icon size={20} /></span><span className="nav-label">{label}</span><span className="nav-short" aria-hidden="true">{short}</span>
        </button>)}
      </nav>
      <div className="sidebar-tip"><span className="tip-icon"><Lightbulb size={17} /></span><strong>Smart tip</strong><p>Recording every day makes each insight more accurate.</p></div>
      <div className="profile-mini">
        <span className="avatar">{initials || <Store size={17} />}</span>
        <div><strong>{business.profile?.name ?? 'No business yet'}</strong><span>{sample ? 'Demo workspace · fictional' : 'My own business'}</span></div>
      </div>
    </aside>
    <div className="main">
      <header className="topbar">
        <button className="mobile-brand" onClick={() => goTo('business')} aria-label="UntungLah home"><Brand /></button>
        <div className="topbar-title"><span>{nav.find(item => item.id === activePage)?.label}</span><small>{dateLabel}</small></div>
        <div className="topbar-actions">
          {sample && <span className="sample-badge"><FlaskConical size={15} /> Sample data</span>}
          <button className="button ghost small" onClick={() => changeView(!sample)}>{sample ? 'My own business' : 'Demo workspace'}</button>
          {initials && <span className="avatar" aria-hidden="true">{initials}</span>}
        </div>
      </header>
      <main className="content">
        {storageError && <p className="error" role="alert">Your browser couldn’t save updates. Keep this page open if you need the current session.</p>}
        {guide && <GuidedBar step={guide.step} highest={guide.highest} select={setStep} exit={() => goTo(activePage)} />}
        {guideComplete && <div className="notice highlight" role="status"><strong>Guided demo completed.</strong><p>Your quiz and improvement goal are saved in the demo workspace.</p></div>}
        {activePage === 'business' && <BusinessPage key={String(sample)} business={business} recommended={recommended} completed={completed} startGuide={startGuide}
          tryDemo={() => changeView(true)} resetDemo={() => { setDemo(demoBusiness()); setGoalDraft(null); }}
          saveProfile={profile => update(previous => ({ ...previous, profile }))}
          addRecord={record => update(previous => ({ ...previous, records: [...previous.records, record] }))}
          deleteRecord={id => update(previous => ({ ...previous, records: previous.records.filter(record => record.id !== id) }))}
          openLesson={selectTopic} toggleGoal={toggleGoal} navigate={goTo} guideAdvance={guide ? () => setStep(1) : undefined} />}
        {activePage === 'learning' && <LearningPage business={business} selected={guide ? 'pricing' : topic} recommended={recommended} completed={completed}
          step={guide ? (guide.step === 2 ? 'check' : 'learn') : lessonStep} setStep={setLessonStep} select={selectTopic} practise={() => goTo('practice')}
          markStep={markStep} onApply={(title, id) => saveSuggestion({ title, topic: id })}
          onSaveCost={cost => update(previous => previous.profile ? { ...previous, profile: { ...previous.profile, cost } } : previous)}
          record={(id, score, total) => update(previous => ({ ...previous, attempts: [...previous.attempts, { topic: id, score, total, date: today() }] }))}
          advance={guide ? () => setStep(guide.step === 1 ? 2 : 3) : undefined} />}
        {activePage === 'practice' && <PracticePage key={String(sample) + Boolean(guide)} business={business} context={context} guided={Boolean(guide)}
          explainStep={guide?.step === 4} onExplain={() => setStep(4)} onGoal={(title, id) => saveSuggestion({ title, topic: id })} />}
        {activePage === 'coach' && <CoachPage key={String(sample)} context={context} businessName={business.profile?.name} onGoal={saveSuggestion} />}
        {activePage === 'progress' && <ProgressPage business={business} completed={completed} suggestion={goalDraft} guided={Boolean(guide)}
          cancel={() => setGoalDraft(null)} save={goal => {
            update(previous => ({ ...previous, goals: [...previous.goals, goal] }));
            setGoalDraft(null);
            if (guide) setView(previous => ({ ...previous, guide: { step: 5, highest: 6 } }));
          }}
          toggle={toggleGoal}
          finish={() => { goTo('progress'); setGuideComplete(true); }} />}
      </main>
    </div>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App />);
