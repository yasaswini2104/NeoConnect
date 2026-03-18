'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, X, BarChart2, CheckCircle } from 'lucide-react';
import { pollsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface PollOption { text: string; votes: string[]; }
interface Poll {
  _id: string; question: string; options: PollOption[];
  isActive: boolean; createdAt: string; createdBy: { name: string };
}

function PollCard({ poll, userId, onVote }: { poll: Poll; userId: string; onVote: () => void }) {
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
  const hasVoted   = poll.options.some(o => o.votes.includes(userId));
  const { isRole } = useAuth();
  const [closing, setClosing] = useState(false);

  const handleVote = async (idx: number) => {
    if (hasVoted || !poll.isActive) return;
    try {
      await pollsApi.vote(poll._id, idx);
      toast.success('Vote cast!');
      onVote();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to vote';
      toast.error(msg);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await pollsApi.close(poll._id);
      toast.success('Poll closed');
      onVote();
    } catch { toast.error('Failed to close poll'); }
    finally { setClosing(false); }
  };

  return (
    <motion.div layout className="neo-card p-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={poll.isActive ? 'default' : 'secondary'}>
              {poll.isActive ? 'Active' : 'Closed'}
            </Badge>
            <span className="text-xs" style={{ color: 'var(--color-neo-muted)' }}>{formatDate(poll.createdAt)}</span>
          </div>
          <h3 className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>{poll.question}</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-neo-muted)' }}>
            by {poll.createdBy?.name} · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          </p>
        </div>
        {isRole('secretariat', 'admin') && poll.isActive && (
          <button onClick={handleClose} disabled={closing}
            className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            {closing ? 'Closing...' : 'Close Poll'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {poll.options.map((opt, i) => {
          const pct    = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
          const myVote = opt.votes.includes(userId);

          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <button
                  onClick={() => handleVote(i)}
                  disabled={hasVoted || !poll.isActive}
                  className="flex items-center gap-2 text-sm font-medium text-left disabled:cursor-default transition-colors"
                  style={{ color: myVote ? 'var(--color-neo-accent-light)' : 'var(--color-neo-text)' }}
                >
                  {myVote && <CheckCircle size={14} style={{ color: 'var(--color-neo-accent)' }} />}
                  {opt.text}
                </button>
                <span className="text-xs ml-4 flex-shrink-0" style={{ color: 'var(--color-neo-muted)' }}>
                  {pct}% ({opt.votes.length})
                </span>
              </div>
              {/* shadcn Progress bar */}
              <Progress
                value={pct}
                indicatorColor={myVote ? 'var(--color-neo-accent)' : 'rgba(99,102,241,0.45)'}
              />
            </div>
          );
        })}
      </div>

      {!poll.isActive && (
        <p className="text-xs mt-4" style={{ color: 'var(--color-neo-muted)' }}>This poll is closed. No more votes accepted.</p>
      )}
    </motion.div>
  );
}

function CreatePollDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions]   = useState(['', '']);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = options.filter(o => o.trim());
    if (valid.length < 2) { toast.error('At least 2 options required'); return; }
    setLoading(true);
    try {
      await pollsApi.create({ question, options: valid });
      toast.success('Poll created!');
      setQuestion('');
      setOptions(['', '']);
      onCreated();
      onClose();
    } catch { toast.error('Failed to create poll'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Question</label>
            <input className="neo-input" placeholder="e.g. Should we allow WFH twice a week?"
              value={question} onChange={e => setQuestion(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-neo-muted)' }}>Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input className="neo-input" placeholder={`Option ${i + 1}`} value={opt}
                    onChange={e => { const arr = [...options]; arr[i] = e.target.value; setOptions(arr); }} />
                  {options.length > 2 && (
                    <button type="button" onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                      <X size={16} style={{ color: 'var(--color-neo-muted)' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button type="button" onClick={() => setOptions([...options, ''])}
                className="mt-2 text-sm" style={{ color: 'var(--color-neo-accent)' }}>
                + Add option
              </button>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm"
              style={{ border: '1px solid var(--color-neo-border)', color: 'var(--color-neo-muted)' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 neo-btn-primary py-2">
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PollsPage() {
  const { user, isRole } = useAuth();
  const [polls, setPolls]       = useState<Poll[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      const res = await pollsApi.getAll();
      setPolls(res.data.polls);
    } catch { toast.error('Failed to load polls'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Polls</h1>
          <p className="mt-1" style={{ color: 'var(--color-neo-muted)' }}>Vote on company decisions and see results</p>
        </div>
        {isRole('secretariat', 'admin') && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)} className="neo-btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Poll
          </motion.button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--color-neo-muted)' }}>Loading polls...</div>
      ) : polls.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
          <p style={{ color: 'var(--color-neo-muted)' }}>No polls yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 max-w-3xl">
          <AnimatePresence>
            {polls.map(poll => (
              <PollCard key={poll._id} poll={poll} userId={user?._id || ''} onVote={load} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreatePollDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
    </div>
  );
}
