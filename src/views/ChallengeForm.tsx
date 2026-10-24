import { useState, type FormEvent } from 'react';
import { DEFAULT_DURATION_DAYS, DEFAULT_TARGET_PAISE, type Challenge } from '../lib/db';
import { paiseToRupeesString, parseRupeesToPaise } from '../lib/money';
import { Field, inputClass, primaryButton } from '../components/ui';

export interface ChallengeValues {
  name: string;
  target_amount: number;
  start_date: string;
  duration_days: number;
  instagram_username: string;
}

export function ChallengeForm({
  initial,
  today,
  submitLabel,
  onSubmit,
}: {
  initial?: Challenge;
  today: string;
  submitLabel: string;
  onSubmit: (v: ChallengeValues) => Promise<void> | void;
}) {
  const [name, setName] = useState(initial?.name ?? '₹1 Lakh in 30 Days');
  const [target, setTarget] = useState(paiseToRupeesString(initial?.target_amount ?? DEFAULT_TARGET_PAISE));
  const [start, setStart] = useState(initial?.start_date ?? today);
  const [duration, setDuration] = useState(String(initial?.duration_days ?? DEFAULT_DURATION_DAYS));
  const [username, setUsername] = useState(initial?.instagram_username ?? '');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const target_amount = parseRupeesToPaise(target);
    const duration_days = parseInt(duration, 10);
    if (!name.trim()) return setError('Give your challenge a name.');
    if (target_amount == null) return setError('Enter a target greater than ₹0.');
    if (!start) return setError('Pick a start date.');
    if (!(duration_days >= 1 && duration_days <= 365)) return setError('Duration must be 1–365 days.');
    await onSubmit({ name: name.trim(), target_amount, start_date: start, duration_days, instagram_username: username.trim().replace(/^@+/, '') });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Challenge name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Revenue target (₹)">
          <input className={inputClass} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
        </Field>
        <Field label="Duration (days)">
          <input className={inputClass} inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
      </div>
      <Field label="Start date">
        <input type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} />
      </Field>
      <Field label="Instagram username (optional)">
        <input className={inputClass} autoCapitalize="off" placeholder="@yourhandle" value={username} onChange={(e) => setUsername(e.target.value)} />
      </Field>
      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" className={`${primaryButton} w-full`}>
        {submitLabel}
      </button>
    </form>
  );
}
