"use client"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface WeekPoint {
  week: string
  impressions: number
}

interface RoiChartProps {
  data: WeekPoint[]
}

function formatWeek(w: string): string {
  return new Date(w).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })
}

function formatK(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

export function RoiChart({ data }: RoiChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    weekLabel: formatWeek(d.week),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
        <XAxis
          dataKey="weekLabel"
          tick={{ fill: "#7a7a88", fontSize: 11, fontFamily: "Space Mono" }}
          axisLine={{ stroke: "#2a2a30" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatK}
          tick={{ fill: "#7a7a88", fontSize: 11, fontFamily: "Space Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#111114",
            border: "1px solid #2a2a30",
            borderRadius: "8px",
            color: "#F0F0F2",
            fontFamily: "Space Mono",
            fontSize: 12,
          }}
          formatter={(v) => [formatK(v as number), "Impressions"]}
          labelStyle={{ color: "#7a7a88", marginBottom: 4 }}
        />
        <Line
          type="monotone"
          dataKey="impressions"
          stroke="#C8FF47"
          strokeWidth={2}
          dot={{ fill: "#C8FF47", r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#C8FF47", stroke: "#080809", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
