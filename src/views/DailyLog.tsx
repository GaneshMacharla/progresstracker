import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Challenge } from '../lib/db';
import type { ChallengeStats, DayStat } from '../lib/stats';
import { saveDailyLog } from '../lib/actions';
import { formatDate } from '../lib/dates';
import { formatINR } from '../lib/money';
import { CheckIcon, CloseIcon, PlusIcon } from '../components/icons';
import { Field, Sheet, inputClass, primaryButton } from '../components/ui';

export function DailyLog({ challenge, stats, today }: { challenge: Challenge; stats: ChallengeStats; today: string }) {
  const [editing, setEditing] = useState<DayStat | null>(null);
  const todayRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    todayRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <>
      <ol className="space-y-3">
        {stats.days.map((d) => {
          const isToday = d.date === today;
          const metPace = d.received >= d.requiredPace && d.requiredPace > 0;
          return (
            <li
              key={d.date}
              ref={isToday ? todayRef : undefined}
              className={`rounded-2xl bg-white p-4 shadow-sm ring-1 dark:bg-zinc-900 ${
                isToday ? 'ring-2 ring-zinc-900 dark:ring-zinc-100' : 'ring-zinc-200/70 dark:ring-zinc-800'
              } ${d.isFuture ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Day {d.day} {isToday && '· Today'}
                  </div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatDate(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </div>
                {!d.isFuture && (
                  <button
                    onClick={() => setEditing(d)}
                    className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {d.log ? 'Edit log' : 'Add log'}
                  </button>
                )}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Metric label="Received" value={formatINR(d.received)} strong />
                <Metric label="Pending" value={formatINR(d.pending)} muted={d.pending === 0} />
                <Metric label="Total so far" value={formatINR(d.cumulative)} />
                <Metric
                  label="Required pace"
                  value={
                    <span className="inline-flex items-center gap-1">
                      {d.requiredPace === 0 ? 'Target hit' : formatINR(d.requiredPace)}
                      {!d.isFuture && metPace && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckIcon width={12} height={12} strokeWidth={3} /> met
                        </span>
                      )}
                    </span>
                  }
                />
              </dl>

              {d.log && (d.log.tasks_completed.length > 0 || d.log.reflection) && (
                <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  {d.log.tasks_completed.length > 0 && (
                    <ul className="space-y-1">
                      {d.log.tasks_completed.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                          <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                  {d.log.reflection && <p className="whitespace-pre-wrap text-sm italic text-zinc-600 dark:text-zinc-400">{d.log.reflection}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <LogSheet challenge={challenge} day={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function Metric({ label, value, strong, muted }: { label: string; value: ReactNode; strong?: boolean; muted?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd
        className={`tabular-nums ${strong ? 'font-bold text-zinc-900 dark:text-zinc-50' : 'font-medium text-zinc-800 dark:text-zinc-200'} ${
          muted ? '!text-zinc-400 dark:!text-zinc-600' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function LogSheet({ challenge, day, onClose }: { challenge: Challenge; day: DayStat | null; onClose: () => void }) {
  const [tasks, setTasks] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [reflection, setReflection] = useState('');

  useEffect(() => {
    setTasks(day?.log?.tasks_completed ?? []);
    setReflection(day?.log?.reflection ?? '');
    setDraft('');
  }, [day]);

  const addTask = () => {
    if (!draft.trim()) return;
    setTasks([...tasks, draft.trim()]);
    setDraft('');
  };

  const save = async () => {
    if (!day) return;
    await saveDailyLog(challenge.id!, day.date, draft.trim() ? [...tasks, draft] : tasks, reflection.trim());
    onClose();
  };

  return (
    <Sheet open={!!day} onClose={onClose} title={day ? `Day ${day.day} · ${formatDate(day.date)}` : ''}>
      <div className="space-y-4">
        <Field label="Tasks completed">
          <ul className="mb-2 space-y-1.5">
            {tasks.map((t, i) => (
              <li key={i} className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800">
                <CheckIcon width={16} height={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="flex-1 text-zinc-800 dark:text-zinc-200">{t}</span>
                <button type="button" onClick={() => setTasks(tasks.filter((_, j) => j !== i))} aria-label={`Remove ${t}`} className="text-zinc-400">
                  <CloseIcon width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="e.g. Posted 3 reels"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTask();
                }
              }}
            />
            <button type="button" onClick={addTask} className="shrink-0 rounded-xl bg-zinc-100 px-3 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" aria-label="Add task">
              <PlusIcon />
            </button>
          </div>
        </Field>
        <Field label="Notes — what worked, what didn't (optional)">
          <textarea className={`${inputClass} min-h-[110px]`} value={reflection} onChange={(e) => setReflection(e.target.value)} />
        </Field>
        <button onClick={save} className={`${primaryButton} w-full`}>
          Save log
        </button>
      </div>
    </Sheet>
  );
}
