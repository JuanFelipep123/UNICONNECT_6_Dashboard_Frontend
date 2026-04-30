import { Home, LogOut, MessageSquare, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthStore } from '@shared/store/authStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/groups', label: 'Grupos', icon: Users },
  { to: '/chat', label: 'Mensajes', icon: MessageSquare },
  { to: '/', label: 'Inicio', icon: Home },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { logout: auth0Logout } = useAuth0();
  const clearSession = useAuthStore((state) => state.clearSession);

  const onLogout = () => {
    clearSession();
    void auth0Logout({ logoutParams: { returnTo: `${window.location.origin}/login` } });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-72 border-r border-ink-100 bg-white/90 p-5 shadow-panel backdrop-blur">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-700">UniConnect</p>
          <h1 className="mt-2 text-2xl font-bold text-ink-900">Dashboard</h1>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-100 text-brand-900'
                    : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onLogout}
          className="mt-8 flex w-full items-center gap-3 rounded-xl border border-ink-100 px-4 py-3 text-sm font-medium text-ink-700 hover:bg-ink-100"
        >
          <LogOut size={18} />
          Cerrar sesion
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-ink-100 bg-white/80 px-8 backdrop-blur">
          <h2 className="text-lg font-semibold text-ink-900">Panel de administracion de grupos</h2>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-900">
            React + Vite
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
