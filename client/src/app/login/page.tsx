'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPw]   = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-neo-black)' }}>
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden"
        style={{ background: 'var(--color-neo-surface)', borderRight: '1px solid var(--color-neo-border)' }}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center neo-glow"
              style={{ background: 'var(--color-neo-accent)' }}>
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>NeoConnect</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Your voice,<br /><span className="gradient-text">amplified.</span>
          </h1>
          <p style={{ color: 'var(--color-neo-muted)', lineHeight: 1.7 }}>
            A transparent platform where every complaint gets resolved, every voice gets heard,
            and management is held accountable.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Cases Resolved', value: '2,847' },
            { label: 'Avg. Response',  value: '3.2 days' },
            { label: 'Satisfaction',   value: '94%' },
            { label: 'Active Cases',   value: '142' },
          ].map((stat) => (
            <div key={stat.label} className="neo-card p-4">
              <div className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--color-neo-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-neo-accent)' }}>
                <Zap size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>NeoConnect</span>
            </div>
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Sign In</h2>
            <p style={{ color: 'var(--color-neo-muted)' }}>Enter your credentials to access the platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Email Address</label>
              <input type="email" className="neo-input" placeholder="you@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="neo-input pr-12"
                  placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-neo-muted)' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="neo-btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-neo-muted)' }}>
            Don&apos;t have an account?{' '}
            <a href="/register" style={{ color: 'var(--color-neo-accent)' }} className="font-medium hover:underline">
              Register
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
