import { db, type Challenge, type DailyLog, type RevenueTransaction } from './db';
import { paiseToRupeesString } from './money';

export function download(filename: string, content: Blob | string, type = 'text/plain') {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function transactionsToCSV(transactions: RevenueTransaction[]): string {
  const header = ['Date', 'Amount (INR)', 'Source', 'Description', 'Status', 'Created at', 'Updated at'];
  const rows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [t.date, paiseToRupeesString(t.amount), t.source, t.description, t.status, t.created_at, t.updated_at]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

interface Backup {
  app: 'revenue-tracker';
  version: 1;
  exported_at: string;
  challenges: Challenge[];
  transactions: RevenueTransaction[];
  dailyLogs: DailyLog[];
}

export async function buildBackup(): Promise<string> {
  const backup: Backup = {
    app: 'revenue-tracker',
    version: 1,
    exported_at: new Date().toISOString(),
    challenges: await db.challenges.toArray(),
    transactions: await db.transactions.toArray(),
    dailyLogs: await db.dailyLogs.toArray(),
  };
  return JSON.stringify(backup, null, 2);
}

/** Replaces all local data with the backup's contents. */
export async function restoreBackup(json: string): Promise<void> {
  const data = JSON.parse(json) as Partial<Backup>;
  if (data.app !== 'revenue-tracker' || !Array.isArray(data.challenges) || !Array.isArray(data.transactions)) {
    throw new Error('This file is not a Revenue Tracker backup.');
  }
  await db.transaction('rw', db.challenges, db.transactions, db.dailyLogs, async () => {
    await Promise.all([db.challenges.clear(), db.transactions.clear(), db.dailyLogs.clear()]);
    await db.challenges.bulkAdd(data.challenges!);
    await db.transactions.bulkAdd(data.transactions!);
    await db.dailyLogs.bulkAdd(data.dailyLogs ?? []);
  });
}
