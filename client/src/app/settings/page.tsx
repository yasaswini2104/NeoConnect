'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Settings, User, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';

const ROLE_LABELS: Record<string, string> = {
  staff: 'Staff',
  secretariat: 'Secretariat / Management',
  case_manager: 'Case Manager',
  admin: 'Admin (IT)',
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(pwForm.current, pwForm.newPw);
      toast.success('Password changed! Please log in again.');
      setTimeout(logout, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Settings size={28} style={{ color: 'var(--color-neo-accent)' }} />
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Settings</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <User size={18} style={{ color: 'var(--color-neo-accent)' }} />
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Profile</h2>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: 'var(--color-neo-accent)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-semibold">{user?.name}</div>
              <div style={{ color: 'var(--color-neo-muted)' }}>{user?.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-xl" style={{ background: 'var(--color-neo-surface)', border: '1px solid var(--color-neo-border)' }}>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-neo-muted)' }}>Role</div>
              <div className="font-medium">{user?.role ? ROLE_LABELS[user.role] : '—'}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--color-neo-surface)', border: '1px solid var(--color-neo-border)' }}>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-neo-muted)' }}>Department</div>
              <div className="font-medium">{user?.department || '—'}</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="neo-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <Lock size={18} style={{ color: 'var(--color-neo-accent)' }} />
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Current Password</label>
              <input type="password" className="neo-input" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>New Password</label>
              <input type="password" className="neo-input" value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} minLength={6} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Confirm New Password</label>
              <input type="password" className="neo-input" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} minLength={6} required />
            </div>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="neo-btn-primary px-6 py-2.5">
              {saving ? 'Saving...' : 'Change Password'}
            </motion.button>
          </form>
        </motion.div>
      </div>
  );
}
