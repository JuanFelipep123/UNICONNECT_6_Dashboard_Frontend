import { Home, LogOut, MessageSquare, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthStore } from '@shared/store/authStore';
import { NotificationBell } from './NotificationBell';

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
    <div className="flex min-h-screen bg-ink-50">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50"
        style={{
          background: '#00284D',
          boxShadow: '2px 0 24px rgba(0,0,0,0.18)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div
            className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: '#D4AF37', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: '#00284D', fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white tracking-tight font-serif">
              UniConnect
            </h1>
            <p
              className="text-[10px] uppercase tracking-widest font-sans font-bold"
              style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em' }}
            >
              Academic Portal
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 mt-2">
          {navItems.map((item) => {
            const active =
              location.pathname === item.to ||
              location.pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="nav-item flex items-center gap-3 px-6 py-3.5 text-sm font-medium"
                style={
                  active
                    ? {
                        borderLeft: '4px solid #D4AF37',
                        background: 'rgba(255,255,255,0.10)',
                        color: '#ffffff',
                      }
                    : {
                        borderLeft: '4px solid transparent',
                        color: 'rgba(255,255,255,0.60)',
                      }
                }
              >
                <span
                  className="material-symbols-outlined"
                  style={
                    active
                      ? { fontVariationSettings: "'FILL' 1", fontSize: '20px' }
                      : { fontSize: '20px' }
                  }
                >
                  {item.icon}
                </span>
                <span className="font-sans">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t pb-4" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
          <button
            type="button"
            onClick={onLogout}
            className="nav-item flex w-full items-center gap-3 px-6 py-3.5 text-sm font-medium text-left"
            style={{ color: 'rgba(255,255,255,0.60)', borderLeft: '4px solid transparent' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              logout
            </span>
            <span className="font-sans">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="ml-64 flex flex-1 flex-col min-h-screen">
        {/* Top Header */}
        <header
          className="sticky top-0 z-40 flex h-16 items-center justify-between px-8"
          style={{
            background: '#F8F9FA',
            borderBottom: '1px solid #E9ECEF',
          }}
        >
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm text-slate-500">
            <span>Dashboard</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              chevron_right
            </span>
            <span className="font-semibold" style={{ color: '#00284D' }}>
              {navItems.find(
                (n) =>
                  location.pathname === n.to ||
                  location.pathname.startsWith(`${n.to}/`),
              )?.label ?? 'Panel'}
            </span>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: '#d3e3ff', color: '#001c39', letterSpacing: '0.08em' }}
            >
              UniConnect
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
        {/* Page content */}
        <main className="flex-1 p-8">{children}</main>

        {/* Footer */}
        <footer
          className="flex items-center justify-between px-8 py-4 border-t"
          style={{ background: '#F8F9FA', borderColor: '#E9ECEF' }}
        >
          <p className="text-xs text-slate-400 font-sans">
            © 2025 Universidad de Caldas · UniConnect Academic Portal
          </p>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-brand-700 transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-brand-700 transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-brand-700 transition-colors">
              Contacto
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
