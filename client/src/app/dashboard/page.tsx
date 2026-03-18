'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, CheckCircle, Clock, TrendingUp, Plus, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { complaintsApi, analyticsApi } from '@/lib/api';
import { StatusBadge, SeverityBadge } from '@/components/Badges';
import { formatRelative } from '@/lib/utils';
import Link from 'next/link';

interface Complaint {
  _id: string;
  trackingId: string;
  title: string;
  category: string;
  department: string;
  severity: string;
  status: string;
  createdAt: string;
  escalationReminderSent?: boolean;
}

interface Stats {
  total: number;
  escalated: number;
  resolved: number;
  byStatus: { _id: string; count: number }[];
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user, isRole } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingId, setTrackingId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const cRes = await complaintsApi.getAll({ limit: 8 });
        setComplaints(cRes.data.complaints);

        if (isRole('secretariat', 'admin')) {
          const sRes = await analyticsApi.getOverview();
          setStats(sRes.data);
        }
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isRole]);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const newCount = complaints.filter(c => c.status === 'New').length;
  const escalatedCount = complaints.filter(c => c.status === 'Escalated').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;

  return (
    <div className="p-8">
      <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          {greet()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--color-neo-muted)' }}>
          Here&apos;s what&apos;s happening on the platform today.
        </p>
      </motion.div>

      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }} className="mb-8">
        <div className="flex gap-3 max-w-lg">
          <div className="relative flex-1">
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--color-neo-muted)',
              pointerEvents: 'none'
            }} 
          />
          <input
            style={{
              background: 'var(--color-neo-surface)',
              border: '1px solid var(--color-neo-border)',
              borderRadius: '8px',
              color: 'var(--color-neo-text)',
              padding: '10px 14px 10px 38px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              width: '100%',
              outline: 'none',
            }}
            placeholder="Track complaint: NEO-2026-001"
            value={trackingId}
            onChange={e => setTrackingId(e.target.value)}
          />
      </div>
      </div>
      </motion.div>

      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: isRole('secretariat', 'admin') ? 'Total Cases' : 'My Cases',
            value: isRole('secretariat', 'admin') ? (stats?.total ?? '—') : complaints.length,
            icon: FileText,
            color: 'var(--color-neo-accent)',
            bg: 'rgba(99,102,241,0.1)',
          },
          {
            label: 'New',
            value: isRole('secretariat', 'admin') ? (stats?.byStatus.find(s => s._id === 'New')?.count ?? 0) : newCount,
            icon: Clock,
            color: '#94a3b8',
            bg: 'rgba(148,163,184,0.1)',
          },
          {
            label: 'In Progress',
            value: isRole('secretariat', 'admin') ? (stats?.byStatus.find(s => s._id === 'In Progress')?.count ?? 0) : inProgressCount,
            icon: TrendingUp,
            color: '#a78bfa',
            bg: 'rgba(167,139,250,0.1)',
          },
          {
            label: isRole('secretariat', 'admin') ? 'Escalated' : 'Resolved',
            value: isRole('secretariat', 'admin') ? (stats?.escalated ?? 0) : complaints.filter(c => c.status === 'Resolved').length,
            icon: isRole('secretariat', 'admin') ? AlertTriangle : CheckCircle,
            color: isRole('secretariat', 'admin') ? '#ef4444' : '#10b981',
            bg: isRole('secretariat', 'admin') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="neo-card p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: stat.color }}>
              {loading ? '—' : stat.value}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-neo-muted)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }} className="neo-card overflow-hidden">
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--color-neo-border)' }}>
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            {isRole('secretariat', 'admin') ? 'Recent Cases' : isRole('case_manager') ? 'Assigned Cases' : 'My Submissions'}
          </h2>
          <div className="flex gap-3">
            {isRole('staff') && (
              <Link href="/complaints/new">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="neo-btn-primary flex items-center gap-2 text-sm">
                  <Plus size={16} /> Submit Complaint
                </motion.button>
              </Link>
            )}
            <Link href="/complaints">
              <button className="text-sm px-4 py-2 rounded-lg" style={{ color: 'var(--color-neo-accent)', border: '1px solid rgba(99,102,241,0.3)' }}>
                View All
              </button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--color-neo-muted)' }}>Loading...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p style={{ color: 'var(--color-neo-muted)' }}>No complaints yet.</p>
            {isRole('staff') && (
              <Link href="/complaints/new">
                <button className="neo-btn-primary mt-4">Submit First Complaint</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-neo-border)' }}>
                  {['Tracking ID', 'Title', 'Category', 'Department', 'Severity', 'Status', 'Submitted'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-neo-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaints.map((c, i) => (
                  <motion.tr
                    key={c._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 * i }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderBottom: '1px solid rgba(42,42,61,0.5)' }}
                    onClick={() => window.location.href = `/complaints/${c._id}`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono" style={{ color: 'var(--color-neo-accent)', fontFamily: 'var(--font-mono)' }}>
                        {c.trackingId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium max-w-xs truncate">{c.title}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-neo-muted)' }}>{c.category}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-neo-muted)' }}>{c.department}</td>
                    <td className="px-6 py-4"><SeverityBadge severity={c.severity} /></td>
                    <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-neo-muted)' }}>{formatRelative(c.createdAt)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
