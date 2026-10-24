import Dexie, { type Table } from 'dexie';

// All money values are stored as integer paise (₹1 = 100 paise).

export type RevenueStatus = 'received' | 'pending';

export interface Challenge {
  id?: number;
  name: string;
  target_amount: number; // paise
  start_date: string; // YYYY-MM-DD (local)
  duration_days: number;
  currency: 'INR';
  instagram_username?: string;
  created_at: string;
}

export interface RevenueTransaction {
  id?: number;
  challenge_id: number;
  amount: number; // paise
  date: string; // YYYY-MM-DD (local)
  source: string;
  description: string;
  status: RevenueStatus;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id?: number;
  challenge_id: number;
  date: string; // YYYY-MM-DD (local)
  tasks_completed: string[];
  reflection: string;
}

export const REVENUE_SOURCES = [
  'Digital product sales',
  'Brand collaborations',
  'Affiliate commissions',
  'Freelancing',
  'Sponsorships',
  'Other',
] as const;

export const DEFAULT_TARGET_PAISE = 100000 * 100;
export const DEFAULT_DURATION_DAYS = 30;

class TrackerDB extends Dexie {
  challenges!: Table<Challenge, number>;
  transactions!: Table<RevenueTransaction, number>;
  dailyLogs!: Table<DailyLog, number>;

  constructor() {
    super('revenue-tracker');
    this.version(1).stores({
      challenges: '++id',
      transactions: '++id, challenge_id, date, status',
      dailyLogs: '++id, challenge_id, [challenge_id+date]',
    });
  }
}

export const db = new TrackerDB();
