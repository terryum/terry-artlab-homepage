'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface DeviceItem {
  device: string;
  visitors: number;
}

const COLORS: Record<string, string> = {
  mobile: '#0d9488',
  desktop: '#6366f1',
  tablet: '#f59e0b',
  smart_tv: '#a78bfa',
};

const FALLBACK = '#94a3b8';

function formatLabel(device: string): string {
  if (!device) return '(unknown)';
  return device.charAt(0).toUpperCase() + device.slice(1);
}

export default function DevicesChart({ data }: { data: DeviceItem[] }) {
  const chartData = data.map((d) => ({
    name: formatLabel(d.device),
    visitors: d.visitors,
    raw: d.device,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 0, right: 8, left: 4, bottom: 0 }}
      >
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} interval={0} />
        <Tooltip />
        <Bar dataKey="visitors" radius={[0, 3, 3, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={COLORS[d.raw] ?? FALLBACK} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
