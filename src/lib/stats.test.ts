import { describe, expect, it } from 'vitest';
import { computeStats } from './stats';
import type { Challenge, RevenueTransaction } from './db';
import { formatINR, parseRupeesToPaise } from './money';

const challenge: Challenge = {
  id: 1,
  name: 'Test',
  target_amount: 100000_00,
  start_date: '2026-10-01',
  duration_days: 30,
  currency: 'INR',
  created_at: '',
};

let nextId = 1;
function tx(rupees: number, status: 'received' | 'pending', date = '2026-10-02'): RevenueTransaction {
  return {
    id: nextId++,
    challenge_id: 1,
    amount: rupees * 100,
    date,
    source: 'Freelancing',
    description: '',
    status,
    created_at: '',
    updated_at: '',
  };
}

const today = '2026-10-10';

describe('computeStats', () => {
  it('received revenue increases the total', () => {
    const s = computeStats(challenge, [tx(5000, 'received')], [], today);
    expect(s.totalReceived).toBe(5000_00);
    expect(s.remaining).toBe(95000_00);
  });

  it('pending revenue is tracked separately and excluded from the total', () => {
    const s = computeStats(challenge, [tx(5000, 'received'), tx(3000, 'pending')], [], today);
    expect(s.totalReceived).toBe(5000_00);
    expect(s.totalPending).toBe(3000_00);
    expect(s.progressPct).toBe(5);
  });

  it('marking pending as received updates totals', () => {
    const p = tx(3000, 'pending');
    const before = computeStats(challenge, [p], [], today);
    const after = computeStats(challenge, [{ ...p, status: 'received' }], [], today);
    expect(before.totalReceived).toBe(0);
    expect(after.totalReceived).toBe(3000_00);
    expect(after.totalPending).toBe(0);
  });

  it('editing and deleting recalculate progress', () => {
    const t = tx(5000, 'received');
    expect(computeStats(challenge, [{ ...t, amount: 2000_00 }], [], today).totalReceived).toBe(2000_00);
    expect(computeStats(challenge, [], [], today)).toMatchObject({ totalReceived: 0, progressPct: 0 });
  });

  it('remaining never drops below zero', () => {
    const s = computeStats(challenge, [tx(150000, 'received')], [], today);
    expect(s.remaining).toBe(0);
    expect(s.progressPct).toBe(150);
  });

  it('computes day, days remaining and required pace', () => {
    const s = computeStats(challenge, [tx(10000, 'received')], [], today);
    expect(s.currentDay).toBe(10);
    expect(s.daysRemaining).toBe(21);
    expect(s.averageDaily).toBe(1000_00);
    expect(s.requiredDaily).toBe(4286_00); // ₹90,000 / 21 days, rounded up to whole rupees
  });

  it('builds a per-day breakdown with cumulative totals', () => {
    const s = computeStats(
      challenge,
      [tx(1000, 'received', '2026-10-01'), tx(2000, 'received', '2026-10-03'), tx(500, 'pending', '2026-10-03')],
      [],
      today,
    );
    expect(s.days).toHaveLength(30);
    expect(s.days[0].cumulative).toBe(1000_00);
    expect(s.days[2]).toMatchObject({ received: 2000_00, pending: 500_00, cumulative: 3000_00 });
    expect(s.bestDay?.day).toBe(3);
  });

  it('handles before-start and after-end states', () => {
    expect(computeStats(challenge, [], [], '2026-09-20')).toMatchObject({ status: 'not-started', currentDay: 0, daysRemaining: 30 });
    expect(computeStats(challenge, [], [], '2026-11-15')).toMatchObject({ status: 'ended', currentDay: 30, daysRemaining: 0 });
  });
});

describe('money', () => {
  it('parses and formats rupees as integer paise', () => {
    expect(parseRupeesToPaise('1,00,000')).toBe(100000_00);
    expect(parseRupeesToPaise('49.99')).toBe(4999);
    expect(parseRupeesToPaise('-5')).toBeNull();
    expect(parseRupeesToPaise('0')).toBeNull();
    expect(parseRupeesToPaise('0', { allowZero: true })).toBe(0);
    expect(parseRupeesToPaise('', { allowZero: true })).toBeNull();
    expect(formatINR(100000_00)).toBe('₹1,00,000');
    expect(formatINR(4999)).toBe('₹49.99');
  });
});
