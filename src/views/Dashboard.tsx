import type { Challenge, RevenueTransaction } from '../lib/db';
import type { ChallengeStats } from '../lib/stats';
import { formatDate } from '../lib/dates';
import { formatINR } from '../lib/money';
import { formatPct } from '../lib/story';
import { DailyRevenueChart } from '../components/charts';
import { TransactionRow } from '../components/TransactionRow';
import { Card, EmptyState, ProgressBar, SectionTitle, Stat } from '../components/ui';

interface Props {
  challenge: Challenge;
  stats: ChallengeStats;
  transactions: RevenueTransaction[];
  onEdit: (tx: RevenueTransaction) => void;
  onSeeAll: () => void;
}

export function Dashboard({ challenge, stats, transactions, onEdit, onSeeAll }: Props) {
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  const dayLabel =
    stats.status === 'not-started'
      ? `Starts ${formatDate(challenge.start_date)}`
      : stats.status === 'ended'
        ? 'Challenge ended'
        : `Day ${stats.currentDay} of ${challenge.duration_days}`;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-zinc-950 p-5 text-white shadow-lg dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <span>Revenue earned</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-white">{dayLabel}</span>
        </div>
        <div className="mt-2 text-4xl font-extrabold tabular-nums tracking-tight">{formatINR(stats.totalReceived)}</div>
        <div className="mt-1 text-sm text-zinc-400">of {formatINR(stats.target)} target</div>
        <ProgressBar pct={stats.progressPct} className="mt-4 bg-white/15 dark:bg-white/10" />
        <div className="mt-2 flex justify-between text-sm">
          <span className="font-bold tabular-nums">{formatPct(stats.progressPct)}</span>
          <span className="tabular-nums text-zinc-400">
            {stats.remaining === 0 ? 'Target reached 🎉' : `${formatINR(stats.remaining)} to go`}
          </span>
        </div>
        {stats.totalPending > 0 && (
          <div className="mt-3 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            + {formatINR(stats.totalPending)} pending — not counted until received
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Remaining" value={formatINR(stats.remaining)} />
        <Stat label="Days remaining" value={stats.daysRemaining} hint={stats.status === 'active' ? 'including today' : undefined} />
        <Stat label="Average daily" value={formatINR(stats.averageDaily)} hint={`over ${Math.max(1, stats.currentDay)} day${stats.currentDay === 1 ? '' : 's'}`} />
        <Stat
          label="Required daily"
          value={stats.remaining === 0 ? '—' : formatINR(stats.requiredDaily)}
          hint={stats.remaining === 0 ? 'target reached' : 'to hit target'}
        />
      </div>

      <Card>
        <SectionTitle>Daily revenue</SectionTitle>
        <DailyRevenueChart stats={stats} />
      </Card>

      <Card>
        <SectionTitle
          action={
            transactions.length > 0 && (
              <button onClick={onSeeAll} className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                See all
              </button>
            )
          }
        >
          Recent revenue
        </SectionTitle>
        {recent.length === 0 ? (
          <EmptyState>No revenue yet. Tap + to record your first sale.</EmptyState>
        ) : (
          <ul className="-my-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {recent.map((t) => (
              <TransactionRow key={t.id} tx={t} onEdit={onEdit} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
