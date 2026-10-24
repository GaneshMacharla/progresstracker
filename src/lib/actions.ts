import { db, type Challenge, type RevenueStatus, type RevenueTransaction } from './db';

export async function createChallenge(input: Omit<Challenge, 'id' | 'created_at' | 'currency'>) {
  return db.challenges.add({ ...input, currency: 'INR', created_at: new Date().toISOString() });
}

export async function updateChallenge(id: number, changes: Partial<Challenge>) {
  await db.challenges.update(id, changes);
}

export interface TransactionInput {
  amount: number;
  date: string;
  source: string;
  description: string;
  status: RevenueStatus;
}

export async function saveTransaction(challengeId: number, input: TransactionInput, id?: number) {
  const now = new Date().toISOString();
  if (id != null) {
    await db.transactions.update(id, { ...input, updated_at: now });
    return id;
  }
  const record: RevenueTransaction = { ...input, challenge_id: challengeId, created_at: now, updated_at: now };
  return db.transactions.add(record);
}

export async function markReceived(id: number) {
  await db.transactions.update(id, { status: 'received', updated_at: new Date().toISOString() });
}

export async function deleteTransaction(id: number) {
  await db.transactions.delete(id);
}

export async function saveDailyLog(challengeId: number, date: string, tasks: string[], reflection: string) {
  const existing = await db.dailyLogs.where({ challenge_id: challengeId, date }).first();
  const tasks_completed = tasks.map((t) => t.trim()).filter(Boolean);
  if (existing?.id != null) {
    await db.dailyLogs.update(existing.id, { tasks_completed, reflection });
  } else {
    await db.dailyLogs.add({ challenge_id: challengeId, date, tasks_completed, reflection });
  }
}

export async function deleteAllData() {
  await db.transaction('rw', db.challenges, db.transactions, db.dailyLogs, async () => {
    await Promise.all([db.challenges.clear(), db.transactions.clear(), db.dailyLogs.clear()]);
  });
}
