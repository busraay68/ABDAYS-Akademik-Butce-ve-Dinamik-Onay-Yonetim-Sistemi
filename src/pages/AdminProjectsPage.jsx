import { useEffect, useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SectionCard } from '../components/shared/SectionCard';
import { adminService } from '../services/adminService';
import {
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

const riskColors = {
  normal: 'bg-success/15 text-success',
  watch: 'bg-warning/15 text-warning',
  critical: 'bg-danger/15 text-danger',
};

const riskLabels = {
  normal: 'Normal',
  watch: 'İzlemede',
  critical: 'Kritik',
};

const formatMoney = (value) =>
  Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 0 });

const emptyProject = {
  ownerUserId: '',
  code: '',
  title: '',
  fundSource: '',
  totalBudget: '',
  startDate: '',
  endDate: '',
  budgetLines: [],
};

export const AdminProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [researchers, setResearchers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyProject);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ totalBudget: '', budgetLines: [] });
  const [budgetError, setBudgetError] = useState('');

  const loadData = async () => {
    try {
      const [projectData, researcherData, categoryData] = await Promise.all([
        adminService.fetchAllProjects(),
        adminService.fetchResearchers(),
        adminService.fetchBudgetCategories(),
      ]);
      setProjects(projectData);
      setResearchers(researcherData);
      setCategories(categoryData);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Veri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError('');

    try {
      await adminService.assignProject(form);
      setShowForm(false);
      setForm(emptyProject);
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Proje oluşturulamadı.');
    } finally {
      setIsSaving(false);
    }
  };

  const addBudgetLineToForm = () => {
    setForm({
      ...form,
      budgetLines: [
        ...form.budgetLines,
        { budgetCategoryId: categories[0]?.id ?? '', name: '', allocatedAmount: '' },
      ],
    });
  };

  const updateFormBudgetLine = (index, field, value) => {
    const lines = [...form.budgetLines];
    lines[index] = { ...lines[index], [field]: value };
    setForm({ ...form, budgetLines: lines });
  };

  const removeFormBudgetLine = (index) => {
    setForm({ ...form, budgetLines: form.budgetLines.filter((_, i) => i !== index) });
  };

  const startBudgetEdit = (project) => {
    setEditingBudget(project.id);
    setBudgetForm({
      totalBudget: project.totalBudget,
      budgetLines: project.budgetLines.map((line) => ({
        id: line.id,
        name: line.name,
        allocatedAmount: line.allocatedAmount,
        budgetCategoryId: line.budgetCategoryId,
      })),
    });
    setBudgetError('');
    setExpandedProject(project.id);
  };

  const addBudgetLineToBudgetForm = () => {
    setBudgetForm({
      ...budgetForm,
      budgetLines: [
        ...budgetForm.budgetLines,
        { budgetCategoryId: categories[0]?.id ?? '', name: '', allocatedAmount: '' },
      ],
    });
  };

  const updateBudgetFormLine = (index, field, value) => {
    const lines = [...budgetForm.budgetLines];
    lines[index] = { ...lines[index], [field]: value };
    setBudgetForm({ ...budgetForm, budgetLines: lines });
  };

  const handleSaveBudget = async (projectId) => {
    setIsSaving(true);
    setBudgetError('');

    try {
      await adminService.updateProjectBudget(projectId, budgetForm);
      setEditingBudget(null);
      await loadData();
    } catch (err) {
      setBudgetError(err.response?.data?.message ?? 'Bütçe güncellenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Projeler yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Proje yönetimi"
        title="Araştırmacılara proje atayın ve bütçeleri güncelleyin"
        description="Yeni proje tanımlayabilir, bütçe kalemlerini düzenleyebilir ve proje dağılımını izleyebilirsiniz."
        actions={
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setFormError(''); }}
            className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            <FolderPlus className="size-4" />
            Proje ata
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* Assign Project Form */}
      {showForm && (
        <SectionCard title="Yeni proje tanımla" description="Proje bilgilerini girerek araştırmacıya proje atayın.">
          <form onSubmit={handleCreateProject} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Araştırmacı</label>
              <select
                value={form.ownerUserId}
                onChange={(e) => setForm({ ...form, ownerUserId: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink"
                required
              >
                <option value="">Araştırmacı seçin</option>
                {researchers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fullName} — {r.department}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Proje Kodu</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate/60"
                placeholder="ABD-301"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-ink">Proje Başlığı</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate/60"
                placeholder="Proje başlığını yazın"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Fon Kaynağı</label>
              <input
                type="text"
                value={form.fundSource}
                onChange={(e) => setForm({ ...form, fundSource: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate/60"
                placeholder="TÜBİTAK 1001, BAP vb."
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Toplam Bütçe (TL)</label>
              <input
                type="number"
                value={form.totalBudget}
                onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate/60"
                placeholder="250000"
                required
                min="1"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Başlangıç Tarihi</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Bitiş Tarihi</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink"
                required
              />
            </div>

            {/* Budget Lines */}
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-ink">Bütçe Kalemleri (Opsiyonel)</label>
                <button
                  type="button"
                  onClick={addBudgetLineToForm}
                  className="inline-flex items-center gap-1 text-xs font-medium text-tide hover:text-tideDark"
                >
                  <Plus className="size-3" /> Kalem ekle
                </button>
              </div>
              {form.budgetLines.map((line, idx) => (
                <div key={idx} className="mb-2 flex items-center gap-2">
                  <select
                    value={line.budgetCategoryId}
                    onChange={(e) => updateFormBudgetLine(idx, 'budgetCategoryId', e.target.value)}
                    className="focus-ring flex-1 rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs text-ink"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={line.name}
                    onChange={(e) => updateFormBudgetLine(idx, 'name', e.target.value)}
                    placeholder="Kalem adı"
                    className="focus-ring flex-1 rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs text-ink placeholder:text-slate/60"
                  />
                  <input
                    type="number"
                    value={line.allocatedAmount}
                    onChange={(e) => updateFormBudgetLine(idx, 'allocatedAmount', e.target.value)}
                    placeholder="Tutar"
                    className="focus-ring w-28 rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs text-ink placeholder:text-slate/60"
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={() => removeFormBudgetLine(idx)}
                    className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-end gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="focus-ring rounded-2xl bg-tide px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-tideDark disabled:opacity-50"
              >
                {isSaving ? 'Atanıyor...' : 'Proje ata'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyProject); setFormError(''); }}
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

      {/* Project List */}
      <SectionCard
        title={`Projeler (${projects.length})`}
        description="Tüm projelerin listesi, bütçe dağılımları ve risk durumları."
      >
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl border border-ink/8 bg-white transition"
            >
              <button
                type="button"
                onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-tide">{project.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskColors[project.riskLevel]}`}>
                        {riskLabels[project.riskLevel]}
                      </span>
                    </div>
                    <p className="mt-0.5 font-medium text-ink">{project.title}</p>
                    <p className="text-xs text-slate">
                      {project.fundSource} · {formatMoney(project.totalBudget)} TL
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {editingBudget !== project.id && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startBudgetEdit(project); }}
                      className="rounded-lg border border-ink/8 bg-white p-1.5 text-slate transition hover:bg-mist hover:text-ink"
                      title="Bütçe düzenle"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                  {expandedProject === project.id ? (
                    <ChevronUp className="size-4 text-slate" />
                  ) : (
                    <ChevronDown className="size-4 text-slate" />
                  )}
                </div>
              </button>

              {expandedProject === project.id && (
                <div className="border-t border-ink/5 px-5 py-4">
                  {editingBudget === project.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-ink">Toplam Bütçe:</label>
                        <input
                          type="number"
                          value={budgetForm.totalBudget}
                          onChange={(e) => setBudgetForm({ ...budgetForm, totalBudget: e.target.value })}
                          className="focus-ring w-40 rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-sm text-ink"
                          min="1"
                        />
                        <span className="text-sm text-slate">TL</span>
                      </div>
                      <p className="text-xs font-medium text-slate uppercase tracking-wider">Bütçe kalemleri</p>
                      {budgetForm.budgetLines.map((line, idx) => (
                        <div key={line.id || idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={line.name}
                            onChange={(e) => updateBudgetFormLine(idx, 'name', e.target.value)}
                            className="focus-ring flex-1 rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs text-ink"
                            placeholder="Kalem adı"
                          />
                          <input
                            type="number"
                            value={line.allocatedAmount}
                            onChange={(e) => updateBudgetFormLine(idx, 'allocatedAmount', e.target.value)}
                            className="focus-ring w-32 rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs text-ink"
                            placeholder="Tutar"
                            min="0"
                          />
                          <span className="text-xs text-slate">TL</span>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addBudgetLineToBudgetForm}
                        className="inline-flex items-center gap-1 text-xs font-medium text-tide hover:text-tideDark"
                      >
                        <Plus className="size-3" /> Yeni kalem ekle
                      </button>
                      {budgetError && (
                        <p className="text-sm text-danger">{budgetError}</p>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleSaveBudget(project.id)}
                          disabled={isSaving}
                          className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-tide px-4 py-2 text-xs font-semibold text-white transition hover:bg-tideDark disabled:opacity-50"
                        >
                          <Save className="size-3" />
                          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBudget(null)}
                          className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-4 py-2 text-xs font-medium text-ink transition hover:bg-mist"
                        >
                          <X className="size-3" />
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-ink/8">
                            <th className="pb-2 pr-4 font-medium text-slate">Kalem</th>
                            <th className="pb-2 pr-4 text-right font-medium text-slate">Tahsis</th>
                            <th className="pb-2 pr-4 text-right font-medium text-slate">Harcanan</th>
                            <th className="pb-2 pr-4 text-right font-medium text-slate">Taahhüt</th>
                            <th className="pb-2 text-right font-medium text-slate">Kalan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.budgetLines.map((line) => (
                            <tr key={line.id} className="border-b border-ink/5 last:border-0">
                              <td className="py-2 pr-4 text-ink">{line.name}</td>
                              <td className="py-2 pr-4 text-right text-ink">{formatMoney(line.allocatedAmount)} TL</td>
                              <td className="py-2 pr-4 text-right text-slate">{formatMoney(line.spentAmount)} TL</td>
                              <td className="py-2 pr-4 text-right text-slate">{formatMoney(line.committedAmount)} TL</td>
                              <td className="py-2 text-right font-medium text-success">{formatMoney(line.availableAmount)} TL</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {projects.length === 0 && (
            <div className="rounded-2xl bg-mist p-6 text-center text-sm text-slate">
              Henüz proje tanımlanmamış.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};
