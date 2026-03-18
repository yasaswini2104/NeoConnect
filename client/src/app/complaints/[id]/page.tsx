'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageSquare, User, Clock } from 'lucide-react';
import { complaintsApi, usersApi } from '@/lib/api';
import { StatusBadge, SeverityBadge } from '@/components/Badges';
import { formatDate, formatRelative, STATUSES } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Note { content: string; addedByName: string; createdAt: string; }
interface CaseManager { _id: string; name: string; email: string; }
interface Complaint {
  _id: string; trackingId: string; title: string; description: string;
  category: string; department: string; location: string; severity: string;
  status: string; isAnonymous: boolean; submitterName?: string;
  assignedTo?: { _id: string; name: string }; assignedToName?: string;
  createdAt: string; notes: Note[]; resolution?: string;
  escalationReminderSent?: boolean; isPublished?: boolean;
}

function PublishForm({ complaintId, onPublished }: { complaintId: string; onPublished: () => void }) {
  const [data, setData] = useState({ publicSummary: '', actionTaken: '', result: '' });
  const [saving, setSaving] = useState(false);

  const handlePublish = async () => {
    if (!data.publicSummary || !data.actionTaken || !data.result) {
      toast.error('Please fill in all three fields');
      return;
    }
    setSaving(true);
    try {
      await complaintsApi.publish(complaintId, data);
      toast.success('Published to Public Hub!');
      onPublished();
    } catch {
      toast.error('Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
          Public Summary <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          className="neo-input"
          placeholder="e.g. Staff reported AC breakdown on Floor 3"
          value={data.publicSummary}
          onChange={e => setData({ ...data, publicSummary: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
          Action Taken <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          className="neo-input"
          placeholder="e.g. Facilities team replaced AC unit"
          value={data.actionTaken}
          onChange={e => setData({ ...data, actionTaken: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
          Result <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          className="neo-input"
          placeholder="e.g. Floor 3 temperature restored, staff comfortable"
          value={data.result}
          onChange={e => setData({ ...data, result: e.target.value })}
        />
      </div>
      <button
        onClick={handlePublish}
        disabled={saving}
        className="neo-btn-primary px-6 py-2"
      >
        {saving ? 'Publishing...' : '🌐 Publish to Public Hub'}
      </button>
    </div>
  );
}

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isRole } = useAuth();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [selectedCM, setSelectedCM] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await complaintsApi.getOne(id);
        setComplaint(res.data.complaint);
        setStatus(res.data.complaint.status);
        if (isRole('secretariat', 'admin')) {
          const cmRes = await usersApi.getCaseManagers();
          setCaseManagers(cmRes.data.users);
        }
      } catch {
        toast.error('Failed to load complaint');
        router.push('/complaints');
      } finally { setLoading(false); }
    }
    load();
  }, [id, isRole, router]);

  const handleAssign = async () => {
    if (!selectedCM) return;
    setSubmitting(true);
    try {
      const res = await complaintsApi.assign(id, selectedCM);
      setComplaint(res.data.complaint);
      setAssignDialogOpen(false);
      toast.success('Case assigned successfully');
    } catch { toast.error('Assignment failed'); }
    finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async () => {
    setSubmitting(true);
    try {
      const res = await complaintsApi.updateStatus(id, {
        status,
        note: note || undefined,
        resolution: resolution || undefined,
      });
      setComplaint(res.data.complaint);
      setNote('');
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="p-8 text-center" style={{ color: 'var(--color-neo-muted)' }}>Loading...</div>
  );
  if (!complaint) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/complaints" className="flex items-center gap-2 text-sm mb-6 hover:opacity-80"
        style={{ color: 'var(--color-neo-muted)' }}>
        <ArrowLeft size={16} /> Back to Complaints
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-sm font-mono px-2 py-1 rounded"
                style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-neo-accent)', fontFamily: 'var(--font-mono)' }}>
                {complaint.trackingId}
              </span>
              <StatusBadge status={complaint.status} />
              <SeverityBadge severity={complaint.severity} />
              {complaint.escalationReminderSent && (
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                  ⚠ Reminder Sent
                </span>
              )}
              {complaint.isPublished && (
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  🌐 Published
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {complaint.title}
            </h1>
          </div>

          {isRole('secretariat', 'admin') && (
            <button onClick={() => setAssignDialogOpen(true)} className="neo-btn-primary text-sm px-4 py-2">
              Assign Case Manager
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
          {[
            { label: 'Category',   value: complaint.category },
            { label: 'Department', value: complaint.department },
            { label: 'Location',   value: complaint.location || 'N/A' },
            { label: 'Submitted',  value: formatDate(complaint.createdAt) },
          ].map(item => (
            <div key={item.label}>
              <div className="text-xs uppercase tracking-wider mb-1"
                style={{ color: 'var(--color-neo-muted)' }}>{item.label}</div>
              <div className="font-medium">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm mb-6" style={{ color: 'var(--color-neo-muted)' }}>
          <span className="flex items-center gap-1">
            <User size={14} />
            {complaint.isAnonymous ? 'Anonymous' : (complaint.submitterName || 'Staff Member')}
          </span>
          {complaint.assignedToName && (
            <span className="flex items-center gap-1">
              <Clock size={14} />
              Assigned to: <strong style={{ color: 'var(--color-neo-text)' }}>{complaint.assignedToName}</strong>
            </span>
          )}
        </div>

        <div className="p-4 rounded-xl"
          style={{ background: 'var(--color-neo-surface)', border: '1px solid var(--color-neo-border)' }}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
        </div>

        {complaint.resolution && (
          <div className="mt-4 p-4 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#10b981' }}>Resolution</div>
            <p className="text-sm">{complaint.resolution}</p>
          </div>
        )}
      </motion.div>

      {isRole('secretariat', 'admin', 'case_manager') && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} className="neo-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Update Case
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all"
                  style={{
                    background: status === s ? 'rgba(99,102,241,0.2)' : 'var(--color-neo-surface)',
                    border: `1px solid ${status === s ? 'rgba(99,102,241,0.5)' : 'var(--color-neo-border)'}`,
                    color: status === s ? 'var(--color-neo-accent-light)' : 'var(--color-neo-muted)',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Add Note</label>
            <textarea className="neo-input resize-none" rows={3}
              placeholder="Add a response or internal note..."
              value={note} onChange={e => setNote(e.target.value)} />
          </div>

          {status === 'Resolved' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
                Resolution Summary
              </label>
              <textarea className="neo-input resize-none" rows={2}
                placeholder="Describe how the issue was resolved..."
                value={resolution} onChange={e => setResolution(e.target.value)} />
            </div>
          )}

          <button onClick={handleStatusUpdate} disabled={submitting} className="neo-btn-primary px-6">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </motion.div>
      )}

      {isRole('secretariat', 'admin') && complaint.status === 'Resolved' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }} className="neo-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Publish to Public Hub
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-neo-muted)' }}>
            Share this resolved case publicly to show staff how their feedback creates change.
          </p>

          {complaint.isPublished ? (
            <div className="p-3 rounded-lg text-sm"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
              This complaint has been published to the Public Hub.
            </div>
          ) : (
            <PublishForm
              complaintId={complaint._id}
              onPublished={() => window.location.reload()}
            />
          )}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }} className="neo-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)' }}>
          <MessageSquare size={18} /> Activity Log
        </h2>
        {complaint.notes.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-neo-muted)' }}>No activity yet.</p>
        ) : (
          <div className="space-y-4">
            {complaint.notes.map((n, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ background: 'var(--color-neo-accent)' }}>
                  {n.addedByName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{n.addedByName}</span>
                    <span className="text-xs" style={{ color: 'var(--color-neo-muted)' }}>
                      {formatRelative(n.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm p-3 rounded-lg"
                    style={{ background: 'var(--color-neo-surface)', border: '1px solid var(--color-neo-border)' }}>
                    {n.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Case Manager</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>
              Select Case Manager
            </label>
            <Select value={selectedCM} onValueChange={setSelectedCM}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a case manager..." />
              </SelectTrigger>
              <SelectContent>
                {caseManagers.map(cm => (
                  <SelectItem key={cm._id} value={cm._id}>
                    {cm.name} — {cm.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button onClick={() => setAssignDialogOpen(false)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ border: '1px solid var(--color-neo-border)', color: 'var(--color-neo-muted)' }}>
              Cancel
            </button>
            <button onClick={handleAssign} disabled={!selectedCM || submitting}
              className="neo-btn-primary px-5 py-2">
              {submitting ? 'Assigning...' : 'Assign'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}