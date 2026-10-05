import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AdminStats } from "@/services/stats";

const COLORS = ["var(--primary)", "var(--lost)", "var(--found)", "var(--success)", "var(--warning)", "var(--info)", "var(--muted-foreground)"];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 font-display font-semibold">{title}</h2>
      <div className="h-64">{children}</div>
    </section>
  );
}

export function AdminCharts({ stats }: { stats: AdminStats }) {
  const lostFound = [
    { name: "Lost", value: stats.totalLost },
    { name: "Found", value: stats.totalFound },
  ];
  const recovery = [
    { name: "Recovered", value: stats.recoveredItems },
    { name: "Open", value: Math.max(0, stats.approvedReports - stats.recoveredItems) },
    { name: "Pending", value: stats.pendingReports },
    { name: "Rejected", value: stats.rejectedReports },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Lost vs Found">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={lostFound} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
              <Cell fill="var(--lost)" />
              <Cell fill="var(--found)" />
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Reports by Category">
        <ResponsiveContainer>
          <BarChart data={stats.byCategory} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" allowDecimals={false} fontSize={12} />
            <YAxis type="category" dataKey="name" fontSize={12} width={90} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Reports by Month">
        <ResponsiveContainer>
          <LineChart data={stats.byMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Legend />
            <Line dataKey="lost" stroke="var(--lost)" strokeWidth={2} />
            <Line dataKey="found" stroke="var(--found)" strokeWidth={2} />
            <Line dataKey="recovered" stroke="var(--success)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Recovery Statistics">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={recovery} dataKey="value" nameKey="name" outerRadius={90}>
              {recovery.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
