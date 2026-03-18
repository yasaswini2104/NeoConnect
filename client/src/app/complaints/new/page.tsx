'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload, X, ArrowLeft } from 'lucide-react';
import { complaintsApi } from '@/lib/api';
import { CATEGORIES, DEPARTMENTS, SEVERITIES } from '@/lib/utils';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewComplaintPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    department: '',
    location: '',
    severity: 'Low',
    isAnonymous: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': ['.pdf'] },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.department) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      files.forEach(f => fd.append('files', f));
      const res = await complaintsApi.create(fd);
      toast.success(`Complaint submitted! ID: ${res.data.complaint.trackingId}`);
      router.push('/complaints');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Submission failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/complaints" className="flex items-center gap-2 text-sm mb-6 hover:opacity-80" style={{ color: 'var(--color-neo-muted)' }}>
          <ArrowLeft size={16} /> Back to Complaints
        </Link>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Submit Complaint</h1>
        <p style={{ color: 'var(--color-neo-muted)' }}>Your submission will receive a unique tracking ID and be assigned to a Case Manager.</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className="neo-card p-5 flex items-center justify-between">
          <div>
            <div className="font-medium mb-1">Submit Anonymously</div>
            <div className="text-sm" style={{ color: 'var(--color-neo-muted)' }}>
              Your name will be hidden from Case Managers
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--color-neo-muted)' }}>
              {form.isAnonymous ? 'ON' : 'OFF'}
            </span>
            <Switch
              checked={form.isAnonymous}
              onCheckedChange={(checked) => setForm({ ...form, isAnonymous: checked })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
            Title <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            className="neo-input"
            placeholder="Brief summary of the issue"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
              Category <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <Select value={form.category} onValueChange={val => setForm({ ...form, category: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
              Department <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <Select value={form.department} onValueChange={val => setForm({ ...form, department: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Location</label>
            <input
              className="neo-input"
              placeholder="Floor 3, Block B..."
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
              Severity <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="flex gap-2">
              {SEVERITIES.map((s: string) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, severity: s })}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: form.severity === s
                      ? s === 'Low' ? 'rgba(52,211,153,0.2)' : s === 'Medium' ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'
                      : 'var(--color-neo-surface)',
                    border: `1px solid ${form.severity === s
                      ? s === 'Low' ? '#34d399' : s === 'Medium' ? '#fbbf24' : '#f87171'
                      : 'var(--color-neo-border)'}`,
                    color: form.severity === s
                      ? s === 'Low' ? '#34d399' : s === 'Medium' ? '#fbbf24' : '#f87171'
                      : 'var(--color-neo-muted)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
            Description <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            className="neo-input resize-none"
            rows={5}
            placeholder="Describe the issue in detail. Include dates, people involved, and any relevant context..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
            Attachments (PDF or Image, max 5 files)
          </label>
          <div
            {...getRootProps()}
            className="rounded-xl p-8 text-center cursor-pointer transition-all"
            style={{
              border: `2px dashed ${isDragActive ? 'var(--color-neo-accent)' : 'var(--color-neo-border)'}`,
              background: isDragActive ? 'rgba(99,102,241,0.05)' : 'var(--color-neo-surface)',
            }}
          >
            <input {...getInputProps()} />
            <Upload size={28} className="mx-auto mb-3" style={{ color: 'var(--color-neo-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-neo-muted)' }}>
              {isDragActive ? 'Drop files here...' : 'Drag & drop files, or click to select'}
            </p>
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'var(--color-neo-surface)', border: '1px solid var(--color-neo-border)' }}>
                  <span className="text-sm truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    style={{ color: 'var(--color-neo-muted)' }}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="neo-btn-primary w-full py-3 text-base"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          ) : 'Submit Complaint'}
        </motion.button>
      </motion.form>
    </div>
  );
}
