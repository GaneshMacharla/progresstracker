import type { Challenge, DailyLog, RevenueTransaction } from './db';
import { addDays, diffDays } from './dates';

export interface DayStat {
  day: number;
  date: string;
  received: number;
  pending: number;
  cumulative: number;
  /** Per-day amount needed from this day onward to still hit the target. */
  requiredPace: number;
  /** Linear target line: target × day / duration. */
  targetPace: number;
  isFuture: boolean;
  log?: DailyLog;
}

export interface ChallengeStats {
  target: number;
  totalReceived: number;
  totalPending: number;
  remaining: number;
  progressPct: number;
  currentDay: number;
  /** Days left including today. */
  daysRemaining: number;
  status: 'not-started' | 'active' | 'ended';
  averageDaily: number;
  requiredDaily: number;
  days: DayStat[];
  bySource: { source: string; amount: number }[];
  bestDay: DayStat | null;
  endDate: string;
}

export function computeStats(
  challenge: Challenge,
  transactions: RevenueTransaction[],
  logs: DailyLog[],
  today: string,
): ChallengeStats {
  const target = challenge.target_amount;
  const duration = challenge.duration_days;
  const received = transactions.filter((t) => t.status === 'received');
  const totalReceived = sum(received.map((t) => t.amount));
  const totalPending = sum(transactions.filter((t) => t.status === 'pending').map((t) => t.amount));
  const remaining = Math.max(0, target - totalReceived);
  const progressPct = target > 0 ? (totalReceived / target) * 100 : 0;

  const offset = diffDays(challenge.start_date, today);
  let status: ChallengeStats['status'];
  let currentDay: number;
  let daysRemaining: number;
  if (offset < 0) {
    status = 'not-started';
    currentDay = 0;
    daysRemaining = duration;
  } else if (offset >= duration) {
    status = 'ended';
    currentDay = duration;
    daysRemaining = 0;
  } else {
    status = 'active';
    currentDay = offset + 1;
    daysRemaining = duration - offset;
  }

  const averageDaily = Math.round(totalReceived / Math.max(1, currentDay));
  const requiredDaily = daysRemaining > 0 ? ceilToRupee(remaining / daysRemaining) : remaining;

  const logByDate = new Map(logs.map((l) => [l.date, l]));
  const days: DayStat[] = [];
  let cumulative = 0;
  for (let i = 0; i < duration; i++) {
    const date = addDays(challenge.start_date, i);
    const dayTx = transactions.filter((t) => t.date === date);
    const dayReceived = sum(dayTx.filter((t) => t.status === 'received').map((t) => t.amount));
    const dayPending = sum(dayTx.filter((t) => t.status === 'pending').map((t) => t.amount));
    const requiredPace = ceilToRupee(Math.max(0, target - cumulative) / (duration - i));
    cumulative += dayReceived;
    days.push({
      day: i + 1,
      date,
      received: dayReceived,
      pending: dayPending,
      cumulative,
      requiredPace,
      targetPace: Math.round((target * (i + 1)) / duration / 100) * 100,
      isFuture: date > today,
      log: logByDate.get(date),
    });
  }

  const sourceTotals = new Map<string, number>();
  for (const t of received) sourceTotals.set(t.source, (sourceTotals.get(t.source) ?? 0) + t.amount);
  const bySource = [...sourceTotals]
    .map(([source, amount]) => ({ source, amount }))
    .sort((a, b) => b.amount - a.amount);

  const bestDay = days.reduce<DayStat | null>(
    (best, d) => (d.received > 0 && (!best || d.received > best.received) ? d : best),
    null,
  );

  return {
    target,
    totalReceived,
    totalPending,
    remaining,
    progressPct,
    currentDay,
    daysRemaining,
    status,
    averageDaily,
    requiredDaily,
    days,
    bySource,
    bestDay,
    endDate: addDays(challenge.start_date, duration - 1),
  };
}

// Pace figures are shown in whole rupees; round up so meeting the pace still hits the target.
function ceilToRupee(paise: number): number {
  return Math.ceil(paise / 100) * 100;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
