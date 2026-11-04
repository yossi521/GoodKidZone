import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Clapperboard,
  Users,
  Trees,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ITEMS = [
  { to: '/', label: 'לוח בקרה', icon: LayoutDashboard, end: true },
  { to: '/episodes', label: 'פרקים', icon: Clapperboard },
  { to: '/characters', label: 'דמויות', icon: Users },
  { to: '/world', label: 'העולם', icon: Trees },
  { to: '/analytics', label: 'אנליטיקה', icon: BarChart3 },
  { to: '/settings', label: 'הגדרות', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-2 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sidebar-primary">
              <Sun className="h-5 w-5 text-sidebar-primary-foreground" />
            </span>
            <div>
              <p className="font-heading text-lg leading-tight">GoodKid Zone</p>
              <p className="text-[11px] text-sidebar-foreground/70">Kind hearts make bright worlds</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-sidebar-accent lg:hidden" aria-label="סגור תפריט">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5">
          <button
            onClick={() => base44.auth.logout()}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent/60"
          >
            <LogOut className="h-4 w-4" />
            התנתקות
          </button>
        </div>
      </aside>
    </>
  );
}