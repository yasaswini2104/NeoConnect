'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Users, Shield, UserCheck, UserX, Search, ChevronDown } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const ROLE_COLORS: Record<string, string> = {
  staff: 'rgba(148,163,184,0.15)',
  secretariat: 'rgba(99,102,241,0.15)',
  case_manager: 'rgba(167,139,250,0.15)',
  admin: 'rgba(239,68,68,0.15)',
};
const ROLE_TEXT: Record<string, string> = {
  staff: '#94a3b8',
  secretariat: '#818cf8',
  case_manager: '#a78bfa',
  admin: '#f87171',
};
const ROLE_LABELS: Record<string, string> = {
  staff: 'Staff',
  secretariat: 'Secretariat',
  case_manager: 'Case Manager',
  admin: 'Admin (IT)',
};

export default function AdminPage() {
  const { isRole, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', department: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await usersApi.getAll(roleFilter ? { role: roleFilter } : {});
      setUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, department: u.department || '' });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await usersApi.update(editingUser._id, editForm);
      toast.success('User updated');
      setEditingUser(null);
      load();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await usersApi.deactivate(id);
      toast.success('User deactivated');
      load();
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  const handleReactivate = async (id: string) => {
  try {
      await usersApi.update(id, { isActive: true });
      toast.success('User reactivated');
      load();
    } catch {
      toast.error('Failed to reactivate');
    }
  };

  if (!isRole('admin')) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center h-full">
          <p style={{ color: 'var(--color-neo-muted)' }}>Access restricted to Admin only.</p>
        </div>
      </AppLayout>
    );
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield size={28} style={{ color: 'var(--color-neo-accent)' }} />
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Admin Panel</h1>
            <p style={{ color: 'var(--color-neo-muted)' }}>User account management &amp; security settings</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: 'var(--color-neo-accent)' },
            { label: 'Staff', value: roleCounts['staff'] || 0, icon: Users, color: '#94a3b8' },
            { label: 'Case Managers', value: roleCounts['case_manager'] || 0, icon: UserCheck, color: '#a78bfa' },
            { label: 'Active', value: users.filter(u => u.isActive).length, icon: UserCheck, color: '#10b981' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} className="neo-card p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}20` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
              <div className="text-sm" style={{ color: 'var(--color-neo-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-neo-muted)' }} />
            <input className="neo-input pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="relative">
            <select className="neo-input pr-8 appearance-none" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="staff">Staff</option>
              <option value="secretariat">Secretariat</option>
              <option value="case_manager">Case Manager</option>
              <option value="admin">Admin</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-neo-muted)' }} />
          </div>
        </div>

        <div className="neo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-neo-border)' }}>
                  {['User', 'Role', 'Department', 'Status', 'Joined', 'Last Login', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-neo-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center" style={{ color: 'var(--color-neo-muted)' }}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center" style={{ color: 'var(--color-neo-muted)' }}>No users found.</td></tr>
                ) : filtered.map((u, i) => (
                  <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.03 * i }}
                    style={{ borderBottom: '1px solid rgba(42,42,61,0.5)', opacity: u.isActive ? 1 : 0.5 }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: 'var(--color-neo-accent)' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{u.name}</div>
                          <div className="text-xs" style={{ color: 'var(--color-neo-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" style={{ background: ROLE_COLORS[u.role], color: ROLE_TEXT[u.role], borderColor: ROLE_TEXT[u.role] }}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-neo-muted)' }}>{u.department || '—'}</td>
                    <td className="px-5 py-4">
                      <Badge variant={u.isActive ? 'default' : 'destructive'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-neo-muted)' }}>{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-neo-muted)' }}>{u.lastLogin ? formatDate(u.lastLogin) : '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(u)} className="text-xs px-2.5 py-1 rounded-md"
                          style={{ color: 'var(--color-neo-accent)', border: '1px solid rgba(99,102,241,0.3)' }}>
                          Edit
                        </button>
                        {u._id !== currentUser?._id && (
                          u.isActive ? (
                            <button
                              onClick={() => handleDeactivate(u._id)}
                              className="text-xs px-2.5 py-1 rounded-md"
                              style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                            >
                              <UserX size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(u._id)}
                              className="text-xs px-2.5 py-1 rounded-md"
                              style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                            >
                              <UserCheck size={13} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Name</label>
                <input className="neo-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Email</label>
                <input className="neo-input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Role</label>
                <Select value={editForm.role} onValueChange={val => setEditForm({ ...editForm, role: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="secretariat">Secretariat</SelectItem>
                    <SelectItem value="case_manager">Case Manager</SelectItem>
                    <SelectItem value="admin">Admin (IT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Department</label>
                <input className="neo-input" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--color-neo-border)', color: 'var(--color-neo-muted)' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 neo-btn-primary py-2">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
