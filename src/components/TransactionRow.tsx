import type { RevenueTransaction } from '../lib/db';
import { markReceived } from '../lib/actions';
import { formatDate } from '../lib/dates';
import { formatINR } from '../lib/money';
import { StatusBadge } from './ui';

export function TransactionRow({ tx, onEdit }: { tx: RevenueTransaction; onEdit: (tx: RevenueTransaction) => void }) {
  const pending = tx.status === 'pending';
  return (
    <li className="flex items-center gap-3 py-3">
      <button onClick={() => onEdit(tx)} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{tx.source}</span>
          <StatusBadge status={tx.status} />
        </div>
        <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {formatDate(tx.date)}
          {tx.description && ` · ${tx.description}`}
        </div>
      </button>
      <div className="flex flex-col items-end gap-1">
        <span className={`text-sm font-bold tabular-nums ${pending ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-50'}`}>
          {formatINR(tx.amount)}
        </span>
        {pending && (
          <button
            onClick={() => markReceived(tx.id!)}
            className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white active:scale-95"
          >
            Mark received
          </button>
        )}
      </div>
    </li>
  );
}
