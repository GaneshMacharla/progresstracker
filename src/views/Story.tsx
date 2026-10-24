import { useEffect, useRef, useState } from 'react';
import type { Challenge } from '../lib/db';
import type { ChallengeStats } from '../lib/stats';
import { updateChallenge } from '../lib/actions';
import { download } from '../lib/export';
import { renderStory, STORY_TEMPLATES, type StoryData, type StoryTemplate } from '../lib/story';
import { DownloadIcon, ShareIcon } from '../components/icons';
import { Field, Segmented, inputClass, primaryButton, secondaryButton } from '../components/ui';

const PREFS_KEY = 'story-prefs';

function loadPrefs(): { template: StoryTemplate; caption: string } {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}');
    return { template: p.template ?? 'minimal', caption: p.caption ?? '' };
  } catch {
    return { template: 'minimal', caption: '' };
  }
}

export function Story({ challenge, stats }: { challenge: Challenge; stats: ChallengeStats }) {
  const [template, setTemplate] = useState<StoryTemplate>(() => loadPrefs().template);
  const [caption, setCaption] = useState(() => loadPrefs().caption);
  const [username, setUsername] = useState(challenge.instagram_username ?? '');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);

  // Figures come straight from the saved records via computeStats — same numbers as the dashboard.
  const data: StoryData = {
    challengeName: challenge.name,
    day: Math.max(1, stats.currentDay),
    duration: challenge.duration_days,
    earned: stats.totalReceived,
    target: stats.target,
    remaining: stats.remaining,
    progressPct: stats.progressPct,
    caption,
    username,
  };

  useEffect(() => {
    if (canvasRef.current) renderStory(canvasRef.current, data, template);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ template, caption }));
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, caption, username, stats.totalReceived, stats.remaining, stats.currentDay, challenge.name, challenge.duration_days, stats.target]);

  const saveUsername = () => {
    const clean = username.trim().replace(/^@+/, '');
    if (clean !== (challenge.instagram_username ?? '')) updateChallenge(challenge.id!, { instagram_username: clean });
  };

  const toBlob = () =>
    new Promise<Blob>((resolve, reject) => canvasRef.current!.toBlob((b) => (b ? resolve(b) : reject(new Error('Render failed'))), 'image/png'));

  const filename = `revenue-day-${data.day}.png`;

  const onDownload = async () => {
    setBusy(true);
    try {
      await renderStory(canvasRef.current!, data, template);
      download(filename, await toBlob());
    } finally {
      setBusy(false);
    }
  };

  const canShare = typeof navigator !== 'undefined' && 'canShare' in navigator;
  const onShare = async () => {
    setBusy(true);
    try {
      await renderStory(canvasRef.current!, data, template);
      const file = new File([await toBlob()], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] });
      else download(filename, file);
    } catch {
      /* share sheet dismissed */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Segmented value={template} onChange={setTemplate} options={STORY_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))} />

      <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
        <canvas ref={canvasRef} width={1080} height={1920} className="block h-auto w-full" aria-label="Instagram Story preview" />
      </div>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">1080 × 1920 PNG · uses your saved received revenue</p>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onDownload} disabled={busy} className={secondaryButton}>
          <DownloadIcon width={18} height={18} /> Download
        </button>
        <button onClick={onShare} disabled={busy || !canShare} className={primaryButton}>
          <ShareIcon width={18} height={18} /> Share
        </button>
      </div>

      <Field label="Caption (optional)">
        <input className={inputClass} maxLength={120} placeholder="e.g. Launched my second ebook today" value={caption} onChange={(e) => setCaption(e.target.value)} />
      </Field>
      <Field label="Instagram username (optional)">
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">@</span>
          <input
            className={`${inputClass} pl-8`}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="yourhandle"
            value={username.replace(/^@+/, '')}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={saveUsername}
          />
        </div>
      </Field>
    </div>
  );
}
