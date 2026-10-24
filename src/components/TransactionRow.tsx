import type { RevenueTransaction } from '../lib/db';
import { markReceived } from '../lib/actions';
import { formatDate } from '../lib/dates';
import { formatINR } from '../lib/money';
import { PencilIcon } from './icons';
import { StatusBadge } from './ui';

export function TransactionRow({ tx, onEdit }: { tx: RevenueTransaction; onEdit: (tx: RevenueTransaction) => void }) {
  const pending = tx.status === 'pending';
  return (
    <li className="flex items-center gap-2 py-3">
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
        <button
          onClick={() => onEdit(tx)}
          className={`text-sm font-bold tabular-nums ${pending ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-50'}`}
          aria-label={`Edit amount ${formatINR(tx.amount)}`}
        >
          {formatINR(tx.amount)}
        </button>
        {pending && (
          <button
            onClick={() => markReceived(tx.id!)}
            className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white active:scale-95"
          >
            Mark received
          </button>
        )}
      </div>
      <button
        onClick={() => onEdit(tx)}
        className="-mr-1 shrink-0 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 active:scale-95 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        aria-label={`Edit ${tx.source} ${formatINR(tx.amount)}`}
      >
        <PencilIcon width={18} height={18} />
      </button>
    </li>
  );
}
