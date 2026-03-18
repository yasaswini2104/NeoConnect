'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { DEPARTMENTS } from '@/lib/utils';

export default function RegisterPage() {
  const { login } = useAuth();
  const router    = useRouter();
  const [form, setForm]     = useState({ name: '', email: '', password: '', department: '', role: 'staff' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { authApi } = await import('@/lib/api');
      await authApi.register(form);
      await login(form.email, form.password);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'var(--color-neo-black)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center neo-glow"
            style={{ background: 'var(--color-neo-accent)' }}>
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>NeoConnect</span>
        </div>

        <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Create Account</h2>
        <p className="mb-8" style={{ color: 'var(--color-neo-muted)' }}>Join the platform to submit and track complaints</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Full Name</label>
            <input className="neo-input" placeholder="John Doe"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Email Address</label>
            <input type="email" className="neo-input" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Password</label>
            <input type="password" className="neo-input" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Department</label>
            <select className="neo-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
              <option value="">Select department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Role</label>
            <select className="neo-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="staff">Staff</option>
              <option value="case_manager">Case Manager</option>
              <option value="secretariat">Secretariat</option>
              <option value="admin">Admin (IT)</option>
            </select>
          </div>
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="neo-btn-primary w-full py-3 mt-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              : 'Create Account'}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-neo-muted)' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: 'var(--color-neo-accent)' }} className="font-medium hover:underline">Sign in</a>
        </p>
      </motion.div>
    </div>
  );
}
