import { useMemo, useState } from 'react';
import type { RevenueTransaction } from '../lib/db';
import type { ChallengeStats } from '../lib/stats';
import { formatDate } from '../lib/dates';
import { formatINR } from '../lib/money';
import { TransactionRow } from '../components/TransactionRow';
import { Card, EmptyState, Segmented, Stat } from '../components/ui';

type Filter = 'all' | 'received' | 'pending';

export function Revenue({ stats, transactions, onEdit }: { stats: ChallengeStats; transactions: RevenueTransaction[]; onEdit: (tx: RevenueTransaction) => void }) {
  const [filter, setFilter] = useState<Filter>('all');

  const groups = useMemo(() => {
    const list = transactions
      .filter((t) => filter === 'all' || t.status === filter)
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
    const byDate = new Map<string, RevenueTransaction[]>();
    for (const t of list) byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);
    return [...byDate];
  }, [transactions, filter]);

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Received" value={formatINR(stats.totalReceived)} hint="counts toward target" />
        <Stat label="Pending" value={formatINR(stats.totalPending)} hint={`${pendingCount} record${pendingCount === 1 ? '' : 's'} · not counted`} />
      </div>

      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'received', label: 'Received' },
          { value: 'pending', label: 'Pending' },
        ]}
      />

      {groups.length === 0 ? (
        <Card>
          <EmptyState>{filter === 'all' ? 'No revenue recorded yet.' : `No ${filter} revenue.`}</EmptyState>
        </Card>
      ) : (
        groups.map(([date, txs]) => {
          const received = txs.filter((t) => t.status === 'received').reduce((s, t) => s + t.amount, 0);
          return (
            <Card key={date} className="py-3">
              <div className="flex items-baseline justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                {received > 0 && <span className="text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">{formatINR(received)} received</span>}
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {txs.map((t) => (
                  <TransactionRow key={t.id} tx={t} onEdit={onEdit} />
                ))}
              </ul>
            </Card>
          );
        })
      )}
      <p className="text-center text-xs text-zinc-400">Tap ✎ on any record to edit its amount or details, or delete it.</p>
    </div>
  );
}
