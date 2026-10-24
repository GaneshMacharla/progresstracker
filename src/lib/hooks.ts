import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { todayISO } from './dates';
import { computeStats } from './stats';

/** Today's date, refreshed every minute so the challenge day rolls over at midnight. */
export function useToday() {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const t = setInterval(() => setToday(todayISO()), 60_000);
    return () => clearInterval(t);
  }, []);
  return today;
}

/** Live view of the active (most recent) challenge and everything derived from it. */
export function useTracker() {
  const today = useToday();
  const challenge = useLiveQuery(async () => (await db.challenges.orderBy('id').last()) ?? null);
  const challengeId = challenge?.id;
  const transactions = useLiveQuery(
    () => (challengeId == null ? [] : db.transactions.where('challenge_id').equals(challengeId).toArray()),
    [challengeId],
  );
  const logs = useLiveQuery(
    () => (challengeId == null ? [] : db.dailyLogs.where('challenge_id').equals(challengeId).toArray()),
    [challengeId],
  );

  const stats = useMemo(
    () => (challenge && transactions && logs ? computeStats(challenge, transactions, logs, today) : null),
    [challenge, transactions, logs, today],
  );

  const loading = challenge === undefined || (challenge !== null && (transactions === undefined || logs === undefined));
  return { loading, challenge, transactions: transactions ?? [], logs: logs ?? [], stats, today };
}

function prefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Chart colours from the validated reference palette, stepped for light or dark surfaces. */
export function useChartColors() {
  const [dark, setDark] = useState(prefersDark);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return dark
    ? { series1: '#3987e5', series2: '#d95926', grid: '#2e2e2c', axis: '#c3c2b7', surface: '#18181b', pending: '#c98500' }
    : { series1: '#2a78d6', series2: '#eb6834', grid: '#e7e6e2', axis: '#52514e', surface: '#ffffff', pending: '#eda100' };
}
