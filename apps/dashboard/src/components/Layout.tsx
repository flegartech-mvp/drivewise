import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import clsx from 'clsx';

const navItems = [
  { to: '/',             label: 'Pregled',          icon: '◈' },
  { to: '/users',        label: 'Uporabniki',       icon: '👤' },
  { to: '/trips',        label: 'Vožnje',           icon: '🚗' },
  { to: '/report',       label: 'Poročilo',         icon: '📊' },
  { to: '/risk-map',     label: 'Tvegana karta',    icon: '🗺' },
  { to: '/traffic',      label: 'Promet',           icon: '🚦' },
  { to: '/roads',        label: 'Cestni podatki',   icon: '🛣' },
  { to: '/data-sources', label: 'Podatkovni viri',  icon: '📡' },
  { to: '/simulation',   label: 'Simulacija',       icon: '🎮' },
];

export default function Layout() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden md:h-screen md:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 bg-surface-800 border-b border-surface-600 md:w-56 md:border-b-0 md:border-r flex flex-col">
        <div className="px-5 py-4 border-b border-surface-600">
          <span className="text-brand-400 font-bold text-lg tracking-tight">DriveWise</span>
          <div className="text-surface-400 text-xs mt-0.5">Admin Dashboard</div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:gap-0 md:overflow-y-auto md:px-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex shrink-0 items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm transition-colors md:rounded-none md:px-5',
                  isActive
                    ? 'bg-surface-700 text-brand-400 font-medium'
                    : 'text-surface-300 hover:text-white hover:bg-surface-700',
                )
              }
            >
              <span className="text-base leading-none w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-5 py-4 border-t border-surface-600 text-xs text-surface-400 md:block">
          <div className="mb-2 truncate">{user?.email}</div>
          <button type="button" onClick={handleLogout} className="text-surface-400 hover:text-white transition-colors">
            Odjava
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-surface-900">
        <Outlet />
      </main>
    </div>
  );
}
