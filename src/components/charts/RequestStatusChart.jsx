import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { SectionCard } from '../shared/SectionCard';

const colors = ['#123047', '#2a8f84', '#e67e4d', '#b23a48'];

export const RequestStatusChart = ({ data }) => (
  <SectionCard
    title="Talep durum dağılımı"
    description="Bekleyen, onaylanan ve revizyona dönen taleplerin özet görünümü."
    className="h-full"
  >
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={68}
            outerRadius={102}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {data.map((item, index) => (
        <div key={item.name} className="rounded-2xl bg-mist p-3">
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
              aria-hidden="true"
            />
            <span className="text-sm text-slate">{item.name}</span>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">{item.value}</p>
        </div>
      ))}
    </div>
  </SectionCard>
);
