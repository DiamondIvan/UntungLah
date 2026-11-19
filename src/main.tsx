import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChartNoAxesCombined, ChevronRight, FlaskConical, Store } from 'lucide-react';
import { nav, GuidedBar, type Page } from './components';
import { BusinessPage } from './business';
import { LearningPage } from './learning';
import { PracticePage } from './practice';
import { CoachPage } from './coach-page';
import { ProgressPage, type GoalDraft } from './progress';
import { demoBusiness, readBusiness, saveBusiness, snapshot, today, topicIds, unitEconomics, type Business, type TopicId } from './domain';
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
  const [quiz, setQuiz] = useState(false);
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

  useEffect(() => { window.scrollTo(0, 0); }, [activePage, guide?.step, topic, quiz]);

  function update(transform: (previous: Business) => Business) {
    (sample ? setDemo : setPersonal)(transform);
  }
  function goTo(next: Page) {
    setView(previous => ({ ...previous, guide: null }));
    setPage(next);
    setGuideComplete(false);
    if (next === 'learning') { setTopic(null); setQuiz(false); }
  }
  function selectTopic(next: TopicId | null) {
    setTopic(next);
    setQuiz(false);
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

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => goTo('business')}><span className="brand-icon"><ChartNoAxesCombined size={23} /></span><span>UntungLah<small>Business learning</small></span></button>
      <p className="nav-label">Workspace</p>
      <nav className="nav-list" aria-label="Main navigation">
        {nav.map(({ id, label, icon: Icon }) => <button className={'nav-item' + (activePage === id ? ' active' : '')} aria-current={activePage === id ? 'page' : undefined} key={id} onClick={() => goTo(id)}><Icon size={20} /><span>{label}</span></button>)}
      </nav>
      <div className="sidebar-foot"><Store size={19} /><div><strong>Built for small businesses</strong><small>Made with Malaysia in mind</small></div></div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{nav.find(item => item.id === activePage)?.label}</strong></div>
        <span className="mobile-wordmark">UntungLah</span>
        <div className="topbar-actions">
          {sample && <span className="sample-badge"><FlaskConical size={15} /> Sample data</span>}
          <button className="button ghost" onClick={() => changeView(!sample)}>{sample ? 'My own business' : 'Demo workspace'}</button>
        </div>
      </header>
      <main className="page">
        {storageError && <p className="error" role="alert">Your browser couldn’t save updates. Keep this page open if you need the current session.</p>}
        {guide && <GuidedBar step={guide.step} highest={guide.highest} select={setStep} exit={() => goTo(activePage)} />}
        {guideComplete && <div className="notice" role="status"><strong>Guided demo completed.</strong><p>Your quiz and improvement goal are saved in the demo workspace.</p></div>}
        {activePage === 'business' && <BusinessPage key={String(sample)} business={business} recommended={recommended} startGuide={startGuide}
          tryDemo={() => changeView(true)} resetDemo={() => { setDemo(demoBusiness()); setGoalDraft(null); }}
          saveProfile={profile => update(previous => ({ ...previous, profile }))}
          addRecord={record => update(previous => ({ ...previous, records: [...previous.records, record] }))}
          deleteRecord={id => update(previous => ({ ...previous, records: previous.records.filter(record => record.id !== id) }))}
          openLesson={selectTopic} guideAdvance={guide ? () => setStep(1) : undefined} />}
        {activePage === 'learning' && <LearningPage business={business} selected={guide ? 'pricing' : topic} recommended={recommended} completed={completed}
          showQuiz={guide ? guide.step === 2 : quiz} select={selectTopic} openQuiz={() => setQuiz(true)}
          record={(id, score, total) => update(previous => ({ ...previous, attempts: [...previous.attempts, { topic: id, score, total, date: today() }] }))}
          advance={guide ? () => setStep(guide.step === 1 ? 2 : 3) : undefined} />}
        {activePage === 'practice' && <PracticePage key={String(sample) + Boolean(guide)} business={business} context={context} guided={Boolean(guide)}
          explainStep={guide?.step === 4} onExplain={() => setStep(4)} onGoal={(title, id) => saveSuggestion({ title, topic: id })} />}
        {activePage === 'coach' && <CoachPage context={context} onGoal={saveSuggestion} />}
        {activePage === 'progress' && <ProgressPage business={business} completed={completed} suggestion={goalDraft} guided={Boolean(guide)}
          cancel={() => setGoalDraft(null)} save={goal => {
            update(previous => ({ ...previous, goals: [...previous.goals, goal] }));
            setGoalDraft(null);
            if (guide) setView(previous => ({ ...previous, guide: { step: 5, highest: 6 } }));
          }}
          toggle={id => update(previous => ({ ...previous, goals: previous.goals.map(goal => goal.id === id ? { ...goal, completed: !goal.completed } : goal) }))}
          finish={() => { goTo('progress'); setGuideComplete(true); }} />}
      </main>
    </div>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App />);
