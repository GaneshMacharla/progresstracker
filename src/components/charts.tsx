import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { ChallengeStats } from '../lib/stats';
import { formatDate } from '../lib/dates';
import { formatINR, formatINRCompact } from '../lib/money';
import { useChartColors } from '../lib/hooks';

const axisTick = (color: string) => ({ fill: color, fontSize: 11 });

function ChartTooltip({ active, payload, label, labelFor }: TooltipProps<number, string> & { labelFor: (l: unknown) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
      <div className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">{labelFor(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey as string} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{formatINR(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

/** Received revenue per challenge day, with today's required pace as a reference line. */
export function DailyRevenueChart({ stats, height = 200 }: { stats: ChallengeStats; height?: number }) {
  const c = useChartColors();
  const data = stats.days.map((d) => ({ day: d.day, date: d.date, received: d.isFuture ? null : d.received }));
  const dateByDay = new Map(stats.days.map((d) => [d.day, d.date]));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke={c.grid} />
        <XAxis dataKey="day" tick={axisTick(c.axis)} tickLine={false} axisLine={{ stroke: c.grid }} interval="preserveStartEnd" minTickGap={12} />
        <YAxis tick={axisTick(c.axis)} tickLine={false} axisLine={false} tickFormatter={formatINRCompact} width={48} />
        {stats.status === 'active' && stats.requiredDaily > 0 && (
          <ReferenceLine
            y={stats.requiredDaily}
            stroke={c.series2}
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{ value: 'Needed / day', position: 'insideTopRight', fill: c.axis, fontSize: 11 }}
          />
        )}
        <Tooltip
          cursor={{ fill: c.grid, opacity: 0.5 }}
          content={<ChartTooltip labelFor={(l) => `Day ${l} · ${formatDate(dateByDay.get(Number(l)) ?? '')}`} />}
        />
        <Bar dataKey="received" name="Received" fill={c.series1} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Cumulative received revenue against the linear pace needed to hit the target. */
export function CumulativeChart({ stats, height = 220 }: { stats: ChallengeStats; height?: number }) {
  const c = useChartColors();
  const data = stats.days.map((d) => ({ day: d.day, actual: d.isFuture ? null : d.cumulative, pace: d.targetPace }));
  const dateByDay = new Map(stats.days.map((d) => [d.day, d.date]));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={c.grid} />
        <XAxis dataKey="day" tick={axisTick(c.axis)} tickLine={false} axisLine={{ stroke: c.grid }} interval="preserveStartEnd" minTickGap={12} />
        <YAxis tick={axisTick(c.axis)} tickLine={false} axisLine={false} tickFormatter={formatINRCompact} width={48} domain={[0, (max: number) => Math.max(max, stats.target)]} />
        <Tooltip
          cursor={{ stroke: c.axis, strokeWidth: 1 }}
          content={<ChartTooltip labelFor={(l) => `Day ${l} · ${formatDate(dateByDay.get(Number(l)) ?? '')}`} />}
        />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: c.axis }} />
        <Line type="linear" dataKey="pace" name="Target pace" stroke={c.series2} strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="actual" name="Actual revenue" stroke={c.series1} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Received revenue per source, largest first, direct-labelled. */
export function SourceChart({ stats }: { stats: ChallengeStats }) {
  const c = useChartColors();
  const data = stats.bySource;
  return (
    <ResponsiveContainer width="100%" height={Math.max(80, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 72, left: 0, bottom: 0 }} barCategoryGap={8}>
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis type="category" dataKey="source" width={120} tick={axisTick(c.axis)} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: c.grid, opacity: 0.5 }} content={<ChartTooltip labelFor={(l) => String(l)} />} />
        <Bar dataKey="amount" name="Received" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((d) => (
            <Cell key={d.source} fill={c.series1} />
          ))}
          <LabelList dataKey="amount" position="right" formatter={(v: number) => formatINR(v)} style={{ fill: c.axis, fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
