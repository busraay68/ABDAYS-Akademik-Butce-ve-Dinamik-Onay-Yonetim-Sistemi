import {
  BarChart3,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const linksByRole = {
  system_admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Kullanıcı Yönetimi', icon: Users },
    { to: '/admin/projects', label: 'Proje Yönetimi', icon: FolderKanban },
    { to: '/admin/approval-rules', label: 'Onay Kuralları', icon: Settings },
    { to: '/reports', label: 'Raporlar', icon: BarChart3 },
  ],
  researcher: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projelerim', icon: FolderKanban },
    { to: '/requests/new', label: 'Yeni Talep', icon: ClipboardList },
    { to: '/requests', label: 'Taleplerim', icon: ListChecks },
    { to: '/reports', label: 'Raporlar', icon: BarChart3 },
  ],
  finance_specialist: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/approvals', label: 'Onay Kuyruğu', icon: ShieldCheck },
    { to: '/reports', label: 'Raporlar', icon: BarChart3 },
  ],
  dean: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/approvals', label: 'Onaylar', icon: ShieldCheck },
    { to: '/reports', label: 'Raporlar', icon: BarChart3 },
  ],
};

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const links = linksByRole[user?.role] ?? [];

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-ink/30 transition md:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`glass-panel fixed left-4 top-4 z-40 flex h-[calc(100vh-2rem)] w-72 flex-col rounded-[30px] p-6 transition duration-300 md:static md:h-auto md:min-h-[calc(100vh-2rem)] md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}
        aria-label="Ana gezinme"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-tide">ABDAYS</p>
        </div>

        <nav className="mt-10 space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-ink text-white shadow-soft'
                    : 'text-ink hover:bg-white/70'
                }`
              }
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>


      </aside>
    </>
  );
};
