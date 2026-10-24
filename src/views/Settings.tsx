import { useRef, useState } from 'react';
import type { Challenge, RevenueTransaction } from '../lib/db';
import { deleteAllData, updateChallenge } from '../lib/actions';
import { buildBackup, download, restoreBackup, transactionsToCSV } from '../lib/export';
import { useInstall } from '../lib/install';
import { Card, SectionTitle, primaryButton, secondaryButton } from '../components/ui';
import { ChallengeForm } from './ChallengeForm';

function InstallCard() {
  const { installed, canPrompt, ios, install } = useInstall();
  if (installed) return null;
  return (
    <Card>
      <SectionTitle>Install the app</SectionTitle>
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
        Add it to your home screen: it opens full-screen, works offline, and the browser is far less likely to clear your data.
      </p>
      {canPrompt ? (
        <button onClick={install} className={`${primaryButton} w-full`}>
          Install app
        </button>
      ) : ios ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          In Safari, tap <strong>Share</strong> → <strong>Add to Home Screen</strong>. The installed app has its own storage, so
          back up here first and restore inside the installed app.
        </p>
      ) : (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
        </p>
      )}
    </Card>
  );
}

export function Settings({ challenge, transactions, today, onDone }: { challenge: Challenge; transactions: RevenueTransaction[]; today: string; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const exportCSV = () => download(`revenue-${today}.csv`, transactionsToCSV(transactions), 'text/csv;charset=utf-8');
  const exportJSON = async () => download(`revenue-tracker-backup-${today}.json`, await buildBackup(), 'application/json');

  const onRestore = async (file: File) => {
    if (!confirm('Restoring replaces all data on this device with the backup. Continue?')) return;
    try {
      await restoreBackup(await file.text());
      setMessage('Backup restored.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  const onReset = async () => {
    if (!confirm('Delete the challenge and every revenue record on this device? Export a backup first if you need one.')) return;
    await deleteAllData();
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Challenge</SectionTitle>
        <ChallengeForm
          initial={challenge}
          today={today}
          submitLabel="Save challenge"
          onSubmit={async (v) => {
            await updateChallenge(challenge.id!, v);
            onDone();
          }}
        />
      </Card>

      <InstallCard />

      <Card>
        <SectionTitle>Your data</SectionTitle>
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Everything is stored on this device only. Back up regularly so you don't lose your records.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={exportCSV} className={secondaryButton} disabled={transactions.length === 0}>
            Export CSV
          </button>
          <button onClick={exportJSON} className={secondaryButton}>
            Backup JSON
          </button>
          <button onClick={() => fileRef.current?.click()} className={`${secondaryButton} col-span-2`}>
            Restore from backup
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onRestore(f);
            e.target.value = '';
          }}
        />
        {message && <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">{message}</p>}
      </Card>

      <Card>
        <SectionTitle>Danger zone</SectionTitle>
        <button onClick={onReset} className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-red-200 dark:text-red-400 dark:ring-red-900">
          Delete all data
        </button>
      </Card>
    </div>
  );
}
