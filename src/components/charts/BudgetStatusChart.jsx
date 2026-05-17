import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '../shared/SectionCard';

export const BudgetStatusChart = ({ data, title = 'Bütçe dağılımı' }) => (
  <SectionCard
    title={title}
    description="Kalem bazlı tahsis, harcama ve kalan bütçe durumu."
    className="h-full"
  >
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="4 4" stroke="#d7e2e8" />
          <XAxis dataKey="name" tick={{ fill: '#4e6476', fontSize: 12 }} />
          <YAxis tick={{ fill: '#4e6476', fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="allocatedAmount" fill="#123047" radius={[10, 10, 0, 0]} name="Tahsis" />
          <Bar dataKey="spentAmount" fill="#e67e4d" radius={[10, 10, 0, 0]} name="Harcama" />
          <Bar dataKey="availableAmount" fill="#2a8f84" radius={[10, 10, 0, 0]} name="Kalan" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </SectionCard>
);
