import { useEffect, useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SectionCard } from '../components/shared/SectionCard';
import { adminService } from '../services/adminService';
import {
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const roleLabels = {
  finance_specialist: 'Mali İşler Uzmanı',
  dean: 'Dekan',
};

const approverRoles = [
  { value: 'finance_specialist', label: 'Mali İşler Uzmanı' },
  { value: 'dean', label: 'Dekan' },
];

const formatMoney = (value) =>
  value !== null && value !== undefined
    ? Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })
    : '—';

const emptyRule = {
  minAmount: '',
  maxAmount: '',
  firstApproverRole: 'finance_specialist',
  secondApproverRole: '',
};

export const AdminApprovalRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyRule);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadRules = async () => {
    try {
      const data = await adminService.fetchApprovalRules();
      setRules(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Kurallar yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError('');

    try {
      const updatedRules = await adminService.createApprovalRule({
        minAmount: Number(form.minAmount),
        maxAmount: form.maxAmount ? Number(form.maxAmount) : null,
        firstApproverRole: form.firstApproverRole,
        secondApproverRole: form.secondApproverRole || null,
      });
      setRules(updatedRules);
      setShowForm(false);
      setForm(emptyRule);
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Kural oluşturulamadı.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      const updatedRules = await adminService.updateApprovalRule(rule.id, {
        isActive: !rule.is_active,
      });
      setRules(updatedRules);
    } catch (err) {
      setError(err.response?.data?.message ?? 'İşlem başarısız.');
    }
  };

  const handleDelete = async (ruleId) => {
    try {
      const updatedRules = await adminService.deleteApprovalRule(ruleId);
      setRules(updatedRules);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Silme işlemi başarısız.');
    }
  };

  // Group rules by min/max amount range
  const groupedRules = rules.reduce((groups, rule) => {
    const key = `${rule.min_amount}-${rule.max_amount}`;
    if (!groups[key]) {
      groups[key] = { minAmount: rule.min_amount, maxAmount: rule.max_amount, steps: [] };
    }
    groups[key].steps.push(rule);
    return groups;
  }, {});

  if (isLoading) {
    return <LoadingSpinner label="Onay kuralları yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Onay kuralları"
        title="Tutar aralıklarına göre onay akışlarını tanımlayın"
        description="Her kural; alt tutar sınırı, üst tutar sınırı, birinci onaycı rolü ve varsa ikinci onaycı rolünü içerir."
        actions={
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setFormError(''); }}
            className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            <Plus className="size-4" />
            Yeni kural tanımla
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* Create Rule Form */}
      {showForm && (
        <SectionCard
          title="Yeni onay kuralı"
          description="Tutar aralığı ve onaycı rollerini belirleyerek yeni bir onay kuralı tanımlayın."
        >
          <form onSubmit={handleCreateRule} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Alt Tutar Sınırı (TL)</label>
              <input
                type="number"
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate/60"
                placeholder="0"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Üst Tutar Sınırı (TL)
                <span className="ml-1 text-xs text-slate font-normal">boş = sınırsız</span>
              </label>
              <input
                type="number"
                value={form.maxAmount}
                onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate/60"
                placeholder="Sınırsız"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Birinci Onaycı Rolü</label>
              <select
                value={form.firstApproverRole}
                onChange={(e) => setForm({ ...form, firstApproverRole: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink"
                required
              >
                {approverRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                İkinci Onaycı Rolü
                <span className="ml-1 text-xs text-slate font-normal">opsiyonel</span>
              </label>
              <select
                value={form.secondApproverRole}
                onChange={(e) => setForm({ ...form, secondApproverRole: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink"
              >
                <option value="">Yok</option>
                {approverRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="focus-ring rounded-2xl bg-tide px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-tideDark disabled:opacity-50"
              >
                {isSaving ? 'Oluşturuluyor...' : 'Kural oluştur'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyRule); setFormError(''); }}
                className="focus-ring rounded-2xl border border-ink/10 bg-white px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-mist"
              >
                İptal
              </button>
            </div>
            {formError && (
              <p className="text-sm text-danger md:col-span-2">{formError}</p>
            )}
          </form>
        </SectionCard>
      )}

      {/* Rules List */}
      <SectionCard
        title={`Tanımlı kurallar (${rules.length})`}
        description="Tutar aralığına göre gruplandırılmış onay adımları."
      >
        {Object.values(groupedRules).length > 0 ? (
          <div className="space-y-4">
            {Object.values(groupedRules).map((group, gIdx) => (
              <div key={gIdx} className="rounded-2xl border border-ink/8 bg-white p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-tide/10 px-3 py-1 text-xs font-semibold text-tide">
                    {formatMoney(group.minAmount)} TL — {group.maxAmount !== null ? `${formatMoney(group.maxAmount)} TL` : '∞'}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.steps.sort((a, b) => a.step_order - b.step_order).map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 transition ${
                        rule.is_active ? 'bg-mist' : 'bg-danger/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                          {rule.step_order}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {roleLabels[rule.approver_role] ?? rule.approver_role}
                          </p>
                          <p className="text-xs text-slate">
                            Adım {rule.step_order} · {rule.is_active ? 'Aktif' : 'Pasif'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rule)}
                          title={rule.is_active ? 'Pasif yap' : 'Aktif yap'}
                          className={`rounded-lg p-1.5 transition ${
                            rule.is_active
                              ? 'text-success hover:bg-success/10'
                              : 'text-slate hover:bg-mist'
                          }`}
                        >
                          {rule.is_active ? (
                            <ToggleRight className="size-5" />
                          ) : (
                            <ToggleLeft className="size-5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rule.id)}
                          title="Kuralı sil"
                          className="rounded-lg p-1.5 text-danger transition hover:bg-danger/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-mist p-6 text-center text-sm text-slate">
            Henüz onay kuralı tanımlanmamış.
          </div>
        )}
      </SectionCard>
    </div>
  );
};
