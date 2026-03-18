'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { complaintsApi } from '@/lib/api';
import { StatusBadge, SeverityBadge } from '@/components/Badges';
import { formatRelative, CATEGORIES, STATUSES, SEVERITIES } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface Complaint {
  _id: string;
  trackingId: string;
  title: string;
  category: string;
  department: string;
  severity: string;
  status: string;
  createdAt: string;
  submitterName?: string;
  assignedToName?: string;
}

export default function ComplaintsPage() {
  const { isRole } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', severity: '' });
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await complaintsApi.getAll({ page, limit: 15, ...filters });
      setComplaints(res.data.complaints);
      setTotal(res.data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? complaints.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.trackingId.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
    )
    : complaints;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Complaints</h1>
          <p className="mt-1" style={{ color: 'var(--color-neo-muted)' }}>{total} total cases</p>
        </div>
        {isRole('staff') && (
          <Link href="/complaints/new">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="neo-btn-primary flex items-center gap-2">
              <Plus size={16} /> New Complaint
            </motion.button>
          </Link>
        )}
      </div>

      {/* Search & filter bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-neo-muted)' }} />
          <input className="neo-input pl-9" placeholder="Search by title, ID, department..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
          style={{
            background: showFilters ? 'rgba(99,102,241,0.15)' : 'var(--color-neo-surface)',
            border: '1px solid var(--color-neo-border)',
            color: showFilters ? 'var(--color-neo-accent)' : 'var(--color-neo-muted)',
          }}
        >
          <Filter size={15} /> Filters
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex gap-3 mb-4 flex-wrap"
        >
          {[
            { key: 'status', options: STATUSES, placeholder: 'All Statuses' },
            { key: 'category', options: CATEGORIES, placeholder: 'All Categories' },
            { key: 'severity', options: SEVERITIES, placeholder: 'All Severities' },
          ].map(({ key, options, placeholder }) => (
            <select
              key={key}
              className="neo-input w-40"
              value={filters[key as keyof typeof filters]}
              onChange={e => setFilters({ ...filters, [key]: e.target.value })}
            >
              <option value="">{placeholder}</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <button onClick={() => setFilters({ status: '', category: '', severity: '' })} className="px-3 py-2 text-sm rounded-lg" style={{ color: 'var(--color-neo-muted)', border: '1px solid var(--color-neo-border)' }}>
            Clear
          </button>
        </motion.div>
      )}

      <div className="neo-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-neo-border)' }}>
                {['ID', 'Title', 'Category', 'Department', 'Severity', 'Status', isRole('secretariat', 'admin') ? 'Assigned To' : 'Submitted', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-neo-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center" style={{ color: 'var(--color-neo-muted)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center" style={{ color: 'var(--color-neo-muted)' }}>No complaints found.</td></tr>
              ) : filtered.map((c, i) => (
                <motion.tr
                  key={c._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.03 * i }}
                  style={{ borderBottom: '1px solid rgba(42,42,61,0.5)' }}
                >
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono" style={{ color: 'var(--color-neo-accent)', fontFamily: 'var(--font-mono)' }}>{c.trackingId}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium max-w-xs">
                    <div className="truncate">{c.title}</div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-neo-muted)' }}>{c.category}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-neo-muted)' }}>{c.department}</td>
                  <td className="px-5 py-4"><SeverityBadge severity={c.severity} /></td>
                  <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-neo-muted)' }}>
                    {isRole('secretariat', 'admin') ? (c.assignedToName || '—') : formatRelative(c.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/complaints/${c._id}`}>
                      <button className="text-xs px-3 py-1 rounded-md" style={{ color: 'var(--color-neo-accent)', border: '1px solid rgba(99,102,241,0.3)' }}>
                        View
                      </button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 15 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--color-neo-border)' }}>
            <span className="text-sm" style={{ color: 'var(--color-neo-muted)' }}>
              Page {page} of {Math.ceil(total / 15)}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm rounded-md disabled:opacity-40" style={{ border: '1px solid var(--color-neo-border)', color: 'var(--color-neo-muted)' }}>Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)} className="px-3 py-1 text-sm rounded-md disabled:opacity-40" style={{ border: '1px solid var(--color-neo-border)', color: 'var(--color-neo-muted)' }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
