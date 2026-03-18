'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Users, BarChart3, Globe,
  Vote, LogOut, Zap, Settings, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['staff', 'secretariat', 'case_manager', 'admin'] },
  { href: '/complaints', label: 'Complaints', icon: FileText, roles: ['staff', 'secretariat', 'case_manager', 'admin'] },
  { href: '/polls', label: 'Polls', icon: Vote, roles: ['staff', 'secretariat', 'case_manager', 'admin'] },
  { href: '/public-hub', label: 'Public Hub', icon: Globe, roles: ['staff', 'secretariat', 'case_manager', 'admin'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['secretariat', 'admin'] },
  { href: '/admin', label: 'Admin', icon: Users, roles: ['admin'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['staff', 'secretariat', 'case_manager', 'admin'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  const roleLabels: Record<string, string> = {
    staff: 'Staff',
    secretariat: 'Secretariat',
    case_manager: 'Case Manager',
    admin: 'Admin (IT)',
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{
        background: 'var(--color-neo-surface)',
        borderRight: '1px solid var(--color-neo-border)',
      }}
    >
      <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-neo-border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center neo-glow-sm flex-shrink-0"
          style={{ background: 'var(--color-neo-accent)' }}>
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-sm leading-tight" style={{ fontFamily: 'var(--font-display)' }}>NeoConnect</div>
          <div className="text-xs" style={{ color: 'var(--color-neo-muted)' }}>v2.0</div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group ${
                  active ? 'neo-glow-sm' : ''
                }`}
                style={{
                  background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: active ? 'var(--color-neo-accent-light)' : 'var(--color-neo-muted)',
                  border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                }}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4" style={{ borderTop: '1px solid var(--color-neo-border)' }}>
        <div className="flex items-center gap-3 p-3 rounded-lg mb-2"
          style={{ background: 'var(--color-neo-card)', border: '1px solid var(--color-neo-border)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ background: 'var(--color-neo-accent)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs truncate" style={{ color: 'var(--color-neo-muted)' }}>
              {user?.role ? roleLabels[user.role] : ''}
            </div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--color-neo-muted)' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
}
