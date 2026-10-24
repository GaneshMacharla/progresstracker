import { useState, type ComponentType, type SVGProps } from 'react';
import type { RevenueTransaction } from './lib/db';
import { createChallenge } from './lib/actions';
import { useTracker } from './lib/hooks';
import { BackIcon, CalendarIcon, ChartIcon, HomeIcon, ImageIcon, ListIcon, PlusIcon, SettingsIcon } from './components/icons';
import { TransactionSheet } from './components/TransactionSheet';
import { Analytics } from './views/Analytics';
import { ChallengeForm } from './views/ChallengeForm';
import { Dashboard } from './views/Dashboard';
import { DailyLog } from './views/DailyLog';
import { Revenue } from './views/Revenue';
import { Settings } from './views/Settings';
import { Story } from './views/Story';

type Tab = 'home' | 'revenue' | 'log' | 'story' | 'analytics' | 'settings';

const TABS: { id: Exclude<Tab, 'settings'>; label: string; title: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'home', label: 'Home', title: '', icon: HomeIcon },
  { id: 'revenue', label: 'Revenue', title: 'Revenue', icon: ListIcon },
  { id: 'log', label: 'Daily log', title: 'Daily progress', icon: CalendarIcon },
  { id: 'story', label: 'Story', title: 'Instagram Story', icon: ImageIcon },
  { id: 'analytics', label: 'Analytics', title: 'Analytics', icon: ChartIcon },
];

export default function App() {
  const { loading, challenge, transactions, stats, today } = useTracker();
  const [tab, setTab] = useState<Tab>('home');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RevenueTransaction | null>(null);

  if (loading) return <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950" />;

  if (!challenge || !stats) {
    return (
      <div className="min-h-dvh bg-zinc-50 px-4 pb-10 pt-[calc(2.5rem+env(safe-area-inset-top))] dark:bg-zinc-950">
        <div className="mx-auto max-w-md">
          <div className="mb-6">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-2xl font-black text-white dark:bg-white dark:text-zinc-900">₹</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Start your challenge</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">Track every rupee of revenue toward your goal and share your progress as an Instagram Story.</p>
          </div>
          <ChallengeForm today={today} submitLabel="Start challenge" onSubmit={async (v) => void (await createChallenge(v))} />
        </div>
      </div>
    );
  }

  const openAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (tx: RevenueTransaction) => {
    setEditing(tx);
    setSheetOpen(true);
  };

  const current = TABS.find((t) => t.id === tab);

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-zinc-50/85 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-4">
          {tab === 'settings' && (
            <button onClick={() => setTab('home')} className="-ml-2 rounded-full p-2 text-zinc-700 dark:text-zinc-300" aria-label="Back">
              <BackIcon />
            </button>
          )}
          <h1 className="flex-1 truncate text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {tab === 'settings' ? 'Settings' : current?.title || challenge.name}
          </h1>
          {tab !== 'settings' && (
            <button onClick={() => setTab('settings')} className="-mr-2 rounded-full p-2 text-zinc-600 dark:text-zinc-400" aria-label="Settings">
              <SettingsIcon />
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4">
        {tab === 'home' && <Dashboard challenge={challenge} stats={stats} transactions={transactions} onEdit={openEdit} onSeeAll={() => setTab('revenue')} />}
        {tab === 'revenue' && <Revenue stats={stats} transactions={transactions} onEdit={openEdit} />}
        {tab === 'log' && <DailyLog challenge={challenge} stats={stats} today={today} />}
        {tab === 'story' && <Story challenge={challenge} stats={stats} />}
        {tab === 'analytics' && <Analytics stats={stats} />}
        {tab === 'settings' && <Settings challenge={challenge} transactions={transactions} today={today} onDone={() => setTab('home')} />}
      </main>

      {tab !== 'settings' && tab !== 'story' && (
        <button
          onClick={openAdd}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-[max(1rem,calc(50%-14rem+1rem))] z-30 flex h-14 items-center gap-2 rounded-full bg-zinc-900 pl-4 pr-5 font-semibold text-white shadow-lg shadow-zinc-900/30 active:scale-95 dark:bg-white dark:text-zinc-900"
          aria-label="Add revenue"
        >
          <PlusIcon /> Revenue
        </button>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                tab === id ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
              }`}
              aria-current={tab === id ? 'page' : undefined}
            >
              <Icon strokeWidth={tab === id ? 2.4 : 1.8} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <TransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} challenge={challenge} today={today} editing={editing} />
    </div>
  );
}
