import type { ChallengeStats } from '../lib/stats';
import { formatDate } from '../lib/dates';
import { formatINR } from '../lib/money';
import { CumulativeChart, DailyRevenueChart, SourceChart } from '../components/charts';
import { Card, EmptyState, SectionTitle, Stat } from '../components/ui';

export function Analytics({ stats }: { stats: ChallengeStats }) {
  // Compare actual revenue to the linear pace as of the latest elapsed day.
  const asOf = stats.days[Math.max(0, stats.currentDay - 1)];
  const paceDiff = stats.currentDay > 0 ? stats.totalReceived - asOf.targetPace : 0;
  const hasData = stats.totalReceived > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Best day"
          value={stats.bestDay ? formatINR(stats.bestDay.received) : '—'}
          hint={stats.bestDay ? `Day ${stats.bestDay.day} · ${formatDate(stats.bestDay.date)}` : 'no revenue yet'}
        />
        <Stat label="Average daily" value={formatINR(stats.averageDaily)} />
        <Stat
          label="Vs target pace"
          value={
            stats.currentDay === 0 ? (
              '—'
            ) : (
              <span className={paceDiff >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                {paceDiff >= 0 ? '▲ ' : '▼ '}
                {formatINR(Math.abs(paceDiff))}
              </span>
            )
          }
          hint={stats.currentDay === 0 ? 'not started' : paceDiff >= 0 ? 'ahead of pace' : 'behind pace'}
        />
        <Stat label="Pace target today" value={stats.currentDay === 0 ? '—' : formatINR(asOf.targetPace)} hint={`by day ${Math.max(1, stats.currentDay)}`} />
      </div>

      <Card>
        <SectionTitle>Actual revenue vs target pace</SectionTitle>
        <CumulativeChart stats={stats} />
      </Card>

      <Card>
        <SectionTitle>Daily revenue</SectionTitle>
        <DailyRevenueChart stats={stats} />
      </Card>

      <Card>
        <SectionTitle>Revenue by source</SectionTitle>
        {hasData ? (
          <>
            <SourceChart stats={stats} />
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
                  <th className="pb-1 font-medium">Source</th>
                  <th className="pb-1 text-right font-medium">Received</th>
                  <th className="pb-1 text-right font-medium">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stats.bySource.map((s) => (
                  <tr key={s.source} className="text-zinc-800 dark:text-zinc-200">
                    <td className="py-1.5">{s.source}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">{formatINR(s.amount)}</td>
                    <td className="py-1.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      {Math.round((s.amount / stats.totalReceived) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <EmptyState>Record received revenue to see the breakdown.</EmptyState>
        )}
      </Card>
    </div>
  );
}
