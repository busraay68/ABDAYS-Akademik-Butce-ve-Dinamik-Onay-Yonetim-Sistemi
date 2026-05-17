import { useEffect, useState } from 'react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SectionCard } from '../components/shared/SectionCard';
import { adminService } from '../services/adminService';
import {
  UserPlus,
  ShieldCheck,
  ShieldOff,
  UserCog,
  Search,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

const roleLabels = {
  system_admin: 'Sistem Yöneticisi',
  researcher: 'Araştırmacı',
  finance_specialist: 'Mali İşler Uzmanı',
  dean: 'Dekan',
};

const roleBadgeColor = {
  system_admin: 'bg-ink text-white',
  researcher: 'bg-tide/15 text-tide',
  finance_specialist: 'bg-warning/15 text-warning',
  dean: 'bg-coral/15 text-coral',
};

const creatableRoles = [
  { value: 'researcher', label: 'Araştırmacı' },
  { value: 'finance_specialist', label: 'Mali İşler Uzmanı' },
  { value: 'dean', label: 'Dekan' },
];

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  department: '',
  role: 'researcher',
};

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await adminService.fetchUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Kullanıcılar yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError('');

    try {
      await adminService.createUser(form);
      setShowForm(false);
      setForm(emptyForm);
      setShowPassword(false);
      await loadUsers();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Kullanıcı oluşturulamadı.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await adminService.updateUser(user.id, { isActive: !user.isActive });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message ?? 'İşlem başarısız.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUser(userId, { role: newRole });
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Rol değiştirilemedi.');
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department.toLowerCase().includes(query) ||
      (roleLabels[user.role] ?? '').toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return <LoadingSpinner label="Kullanıcılar yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Kullanıcı yönetimi"
        title="Hesapları oluşturun, rolleri ve durumları yönetin"
        description="Sistem Yöneticisi, Mali İşler Uzmanı ve Dekan rollerine sahip hesapları oluşturabilir; kullanıcıları aktif/pasif yapabilirsiniz."
        actions={
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setFormError(''); }}
            className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            <UserPlus className="size-4" />
            Yeni hesap oluştur
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <SectionCard title="Yeni kullanıcı oluştur" description="Hesap bilgilerini girerek yeni kullanıcı ekleyin.">
          <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Ad Soyad</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate/60"
                placeholder="Kullanıcının adı soyadı"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">E-posta</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate/60"
                placeholder="ornek@abdays.edu.tr"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 pr-10 text-sm text-ink placeholder:text-slate/60"
                  placeholder="En az 8 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Bölüm</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate/60"
                placeholder="Bölüm veya birim adı"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="focus-ring w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink"
              >
                {creatableRoles.map((role) => (
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
                {isSaving ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); setFormError(''); setShowPassword(false); }}
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

      {/* User List */}
      <SectionCard
        title={`Kullanıcılar (${filteredUsers.length})`}
        description="Tüm hesapların listesi, rolleri ve durumları."
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kullanıcı ara..."
              className="focus-ring w-64 rounded-xl border border-ink/10 bg-white py-2 pl-9 pr-9 text-sm text-ink placeholder:text-slate/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/8">
                <th className="pb-3 pr-4 font-medium text-slate">Ad Soyad</th>
                <th className="pb-3 pr-4 font-medium text-slate">E-posta</th>
                <th className="pb-3 pr-4 font-medium text-slate">Bölüm</th>
                <th className="pb-3 pr-4 font-medium text-slate">Rol</th>
                <th className="pb-3 pr-4 font-medium text-slate">Durum</th>
                <th className="pb-3 font-medium text-slate">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-3.5 pr-4 font-medium text-ink">{u.fullName}</td>
                  <td className="py-3.5 pr-4 text-slate">{u.email}</td>
                  <td className="py-3.5 pr-4 text-slate">{u.department}</td>
                  <td className="py-3.5 pr-4">
                    {editingUser === u.id && u.role !== 'system_admin' ? (
                      <select
                        defaultValue={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        onBlur={() => setEditingUser(null)}
                        autoFocus
                        className="focus-ring rounded-lg border border-ink/10 bg-white px-2 py-1 text-xs text-ink"
                      >
                        {creatableRoles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${roleBadgeColor[u.role] ?? 'bg-mist text-ink'}`}
                      >
                        {roleLabels[u.role] ?? u.role}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        u.isActive
                          ? 'bg-success/15 text-success'
                          : 'bg-danger/15 text-danger'
                      }`}
                    >
                      {u.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="py-3.5">
                    {u.role !== 'system_admin' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingUser(u.id)}
                          title="Rol değiştir"
                          className="rounded-lg border border-ink/8 bg-white p-1.5 text-slate transition hover:bg-mist hover:text-ink"
                        >
                          <UserCog className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          title={u.isActive ? 'Pasif yap' : 'Aktif yap'}
                          className={`rounded-lg border p-1.5 transition ${
                            u.isActive
                              ? 'border-danger/20 bg-white text-danger hover:bg-danger/10'
                              : 'border-success/20 bg-white text-success hover:bg-success/10'
                          }`}
                        >
                          {u.isActive ? <ShieldOff className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate">
                    {searchQuery ? 'Aramayla eşleşen kullanıcı bulunamadı.' : 'Henüz kullanıcı yok.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};
