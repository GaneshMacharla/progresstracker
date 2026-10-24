import { useEffect, useRef, useState, type FormEvent } from 'react';
import { REVENUE_SOURCES, type Challenge, type RevenueStatus, type RevenueTransaction } from '../lib/db';
import { deleteTransaction, saveTransaction } from '../lib/actions';
import { addDays } from '../lib/dates';
import { paiseToRupeesString, parseRupeesToPaise } from '../lib/money';
import { Field, Segmented, Sheet, inputClass, primaryButton } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  challenge: Challenge;
  today: string;
  /** Transaction to edit; omit to add a new one. */
  editing?: RevenueTransaction | null;
}

export function TransactionSheet({ open, onClose, challenge, today, editing }: Props) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [source, setSource] = useState<string>(REVENUE_SOURCES[0]);
  const [customSource, setCustomSource] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<RevenueStatus>('received');
  const [error, setError] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const known = (REVENUE_SOURCES as readonly string[]).includes(editing.source);
      setAmount(paiseToRupeesString(editing.amount));
      setDate(editing.date);
      setSource(known ? editing.source : 'Other');
      setCustomSource(known ? '' : editing.source);
      setDescription(editing.description);
      setStatus(editing.status);
    } else {
      setAmount('');
      setDate(today);
      setSource(REVENUE_SOURCES[0]);
      setCustomSource('');
      setDescription('');
      setStatus('received');
    }
    setError('');
    setTimeout(() => amountRef.current?.focus(), 50);
  }, [open, editing, today]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // ₹0 is valid: it records a day with no earnings.
    const paise = parseRupeesToPaise(amount, { allowZero: true });
    if (paise == null) return setError('Enter an amount of ₹0 or more.');
    if (!date) return setError('Pick a date.');
    const finalSource = source === 'Other' && customSource.trim() ? customSource.trim() : source;
    await saveTransaction(
      challenge.id!,
      { amount: paise, date, source: finalSource, description: description.trim(), status },
      editing?.id,
    );
    onClose();
  };

  const remove = async () => {
    if (editing?.id == null) return;
    if (!confirm('Delete this revenue record?')) return;
    await deleteTransaction(editing.id);
    onClose();
  };

  const endDate = addDays(challenge.start_date, challenge.duration_days - 1);

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit revenue' : 'Add revenue'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Amount (₹)">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-400">₹</span>
            <input
              ref={amountRef}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} pl-9 text-2xl font-bold tabular-nums`}
              aria-required="true"
            />
          </div>
        </Field>

        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'received', label: 'Received' },
            { value: 'pending', label: 'Pending' },
          ]}
        />
        {status === 'pending' && (
          <p className="-mt-2 text-xs text-amber-700 dark:text-amber-300">Pending revenue is not counted until you mark it received.</p>
        )}

        <Field label="Date" hint={date && (date < challenge.start_date || date > endDate) ? 'This date is outside the challenge window.' : undefined}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
        </Field>

        <Field label="Revenue source">
          <div className="flex flex-wrap gap-2">
            {REVENUE_SOURCES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
                  source === s
                    ? 'bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white'
                    : 'bg-white text-zinc-700 ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {source === 'Other' && (
            <input
              className={`${inputClass} mt-2`}
              placeholder="Name the source (optional)"
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
            />
          )}
        </Field>

        <Field label="Description (optional)">
          <input
            className={inputClass}
            placeholder="e.g. Notion template — 5 sales"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2 pt-1">
          {editing && (
            <button type="button" onClick={remove} className="rounded-xl px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-red-200 dark:text-red-400 dark:ring-red-900">
              Delete
            </button>
          )}
          <button type="submit" className={`${primaryButton} flex-1`}>
            {editing ? 'Save changes' : 'Add revenue'}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
