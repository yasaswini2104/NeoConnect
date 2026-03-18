'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { AlertTriangle, TrendingUp, BarChart3, Flame } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#a78bfa', '#38bdf8', '#10b981', '#f59e0b', '#ef4444'];

interface OverviewData {
  total: number;
  escalated: number;
  resolved: number;
  byStatus: { _id: string; count: number }[];
  byCategory: { _id: string; count: number }[];
  bySeverity: { _id: string; count: number }[];
}

interface HeatmapData {
  departmentTotals: { _id: string; total: number }[];
  heatmap: { _id: { department: string; category: string }; count: number }[];
}

interface Hotspot {
  _id: { department: string; category: string };
  count: number;
  complaints: string[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-neo-card)', border: '1px solid var(--color-neo-border)' }}>
        <p style={{ color: 'var(--color-neo-muted)' }}>{label}</p>
        <p className="font-bold" style={{ color: 'var(--color-neo-accent-light)' }}>{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { isRole } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isRole('secretariat', 'admin')) return;
    async function load() {
      try {
        const [ov, hm, hs] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getHeatmap(),
          analyticsApi.getHotspots(),
        ]);
        setOverview(ov.data);
        setHeatmap(hm.data);
        setHotspots(hs.data.hotspots);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isRole]);

  if (!isRole('secretariat', 'admin')) {
    return (
        <div className="p-8 flex items-center justify-center h-full">
          <p style={{ color: 'var(--color-neo-muted)' }}>Access restricted to Secretariat and Admin only.</p>
        </div>
    );
  }

  const statusData = overview?.byStatus.map(s => ({ name: s._id, value: s.count })) || [];
  const categoryData = overview?.byCategory.map(c => ({ name: c._id, value: c.count })) || [];
  const deptData = heatmap?.departmentTotals.slice(0, 8).map(d => ({ name: d._id, count: d.total })) || [];

  return (
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={28} style={{ color: 'var(--color-neo-accent)' }} />
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Analytics</h1>
          </div>
          <p style={{ color: 'var(--color-neo-muted)' }}>Insights on complaints, departments, and escalation patterns</p>
        </div>

        {loading ? (
          <div className="text-center py-20" style={{ color: 'var(--color-neo-muted)' }}>Loading analytics...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Cases', value: overview?.total ?? 0, icon: TrendingUp, color: 'var(--color-neo-accent)' },
                { label: 'Resolved', value: overview?.resolved ?? 0, icon: TrendingUp, color: '#10b981' },
                { label: 'Escalated', value: overview?.escalated ?? 0, icon: AlertTriangle, color: '#ef4444' },
                { label: 'Hotspots Detected', value: hotspots.length, icon: Flame, color: '#f59e0b' },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="neo-card p-5"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${kpi.color}20` }}>
                    <kpi.icon size={20} style={{ color: kpi.color }} />
                  </div>
                  <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: kpi.color }}>
                    {kpi.value}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-neo-muted)' }}>{kpi.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="neo-card p-6">
                <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                  Department Issue Heatmap
                </h2>
                {deptData.length === 0 ? (
                  <p className="text-center py-8" style={{ color: 'var(--color-neo-muted)' }}>No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={deptData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]}>
                        {deptData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="neo-card p-6">
                <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                  Cases by Status
                </h2>
                {statusData.length === 0 ? (
                  <p className="text-center py-8" style={{ color: 'var(--color-neo-muted)' }}>No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                      >
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(val) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{val}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="neo-card p-6 mb-6">
              <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Cases by Category</h2>
              {categoryData.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--color-neo-muted)' }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData} margin={{ left: 0, right: 20, top: 10 }}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Hotspot detection */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="neo-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Flame size={20} style={{ color: '#f59e0b' }} />
                <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Problem Hotspots</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                  5+ cases same dept &amp; category
                </span>
              </div>

              {hotspots.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <TrendingUp size={24} style={{ color: '#10b981' }} />
                  </div>
                  <p style={{ color: 'var(--color-neo-muted)' }}>No hotspots detected — all departments look healthy!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hotspots.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                          <Flame size={18} style={{ color: '#f59e0b' }} />
                        </div>
                        <div>
                          <div className="font-semibold">{h._id.department}</div>
                          <div className="text-sm" style={{ color: 'var(--color-neo-muted)' }}>{h._id.category} category</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#f59e0b' }}>{h.count}</div>
                        <div className="text-xs" style={{ color: 'var(--color-neo-muted)' }}>complaints</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
  );
}
