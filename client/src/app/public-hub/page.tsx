'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Globe, BookOpen, Table2, FileText, Search, Upload, Download } from 'lucide-react';
import { publicHubApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DigestItem {
  _id: string;
  trackingId: string;
  category: string;
  department: string;
  publicSummary: string;
  actionTaken: string;
  result: string;
  resolvedAt: string;
}

interface Minute {
  _id: string;
  title: string;
  description: string;
  date: string;
  filename: string; 
  originalName: string;
  uploadedBy: { name: string };
  tags: string[];
}

export default function PublicHubPage() {
  const { isRole } = useAuth();

  const [digest, setDigest] = useState<DigestItem[]>([]);
  const [impact, setImpact] = useState<DigestItem[]>([]);
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    date: '',
    tags: ''
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('digest');

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
    'http://localhost:5000';

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        if (activeTab === 'digest') {
          const res = await publicHubApi.getDigest();
          setDigest(res.data.complaints);
        } else if (activeTab === 'impact') {
          const res = await publicHubApi.getImpact();
          setImpact(res.data.impacts);
        } else {
          const res = await publicHubApi.getMinutes({ search, limit: 20 });
          setMinutes(res.data.minutes);
        }
      } catch {
        toast.error('Failed to load');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [activeTab, search]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData();

      Object.entries(uploadForm).forEach(([k, v]) =>
        fd.append(k, v)
      );

      fd.append('file', uploadFile);

      await publicHubApi.uploadMinutes(fd);

      toast.success('Minutes uploaded!');

      setShowUpload(false);
      setUploadForm({ title: '', description: '', date: '', tags: '' });
      setUploadFile(null);

      setActiveTab('minutes');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">

      <div className="flex items-center justify-between mb-8">

        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe size={28} style={{ color: 'var(--color-neo-accent)' }} />
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Public Hub
            </h1>
          </div>

          <p style={{ color: 'var(--color-neo-muted)' }}>
            Transparency about how your feedback creates real change
          </p>
        </div>

        {isRole('secretariat', 'admin') && (
          <button
            onClick={() => setShowUpload(true)}
            className="neo-btn-primary flex items-center gap-2"
          >
            <Upload size={16} />
            Upload Minutes
          </button>
        )}

      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>

        <TabsList className="mb-2">
          <TabsTrigger value="digest">
            <BookOpen size={15} className="mr-1" />
            Quarterly Digest
          </TabsTrigger>

          <TabsTrigger value="impact">
            <Table2 size={15} className="mr-1" />
            Impact Tracking
          </TabsTrigger>

          <TabsTrigger value="minutes">
            <FileText size={15} className="mr-1" />
            Meeting Minutes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="digest">
          <div className="space-y-5 max-w-3xl">

            {loading ? (
              <p style={{ color: 'var(--color-neo-muted)' }}>Loading...</p>
            ) : digest.length === 0 ? (
              <div className="neo-card p-12 text-center">
                <p style={{ color: 'var(--color-neo-muted)' }}>
                  No published cases yet.
                </p>
              </div>
            ) : (
              digest.map((item, i) => (

                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="neo-card p-6"
                >

                  <div className="flex items-center gap-3 mb-3 flex-wrap">

                    <span
                      className="text-xs font-mono"
                      style={{
                        color: 'var(--color-neo-accent)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {item.trackingId}
                    </span>

                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(99,102,241,0.15)',
                        color: 'var(--color-neo-accent)'
                      }}
                    >
                      {item.category}
                    </span>

                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-neo-muted)' }}
                    >
                      {item.department}
                    </span>

                    <span
                      className="text-xs ml-auto"
                      style={{ color: 'var(--color-neo-muted)' }}
                    >
                      Resolved {formatDate(item.resolvedAt)}
                    </span>

                  </div>

                  <h3 className="font-semibold mb-2">
                    {item.publicSummary}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">

                    <div
                      className="p-3 rounded-lg"
                      style={{ background: 'var(--color-neo-surface)' }}
                    >
                      <div
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: 'var(--color-neo-muted)' }}
                      >
                        Action Taken
                      </div>
                      <div>{item.actionTaken}</div>
                    </div>

                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)'
                      }}
                    >
                      <div
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: '#10b981' }}
                      >
                        Result
                      </div>
                      <div>{item.result}</div>
                    </div>

                  </div>

                </motion.div>

              ))
            )}

          </div>
        </TabsContent>

        <TabsContent value="impact">

          <div className="neo-card overflow-hidden">

            <table className="w-full">

              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-neo-border)' }}>
                  {['Issue Raised', 'Category', 'Department', 'Action Taken', 'Result', 'Resolved']
                    .map(h => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--color-neo-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : impact.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      No impact data yet.
                    </td>
                  </tr>
                ) : (
                  impact.map(item => (

                    <tr key={item._id}>

                      <td className="px-5 py-4 text-sm">
                        {item.publicSummary}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {item.category}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {item.department}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {item.actionTaken}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm px-2 py-1 rounded-lg bg-green-100 text-green-600">
                          {item.result}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {formatDate(item.resolvedAt)}
                      </td>

                    </tr>

                  ))
                )}

              </tbody>

            </table>

          </div>

        </TabsContent>

        <TabsContent value="minutes">

          <div className="flex gap-3 mb-5">

            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="neo-input pl-9"
                placeholder="Search minutes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

          </div>

          <div className="grid gap-4 max-w-3xl">

            {minutes.map((m, i) => (

              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                className="neo-card p-5 flex items-start gap-4"
              >

                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <FileText size={22} />
                </div>

                <div className="flex-1">

                  <h3 className="font-semibold mb-1">
                    {m.title}
                  </h3>

                  <div className="text-xs mb-2">
                    {formatDate(m.date)} · by {m.uploadedBy?.name}
                  </div>

                </div>

                <a
                  href={`${API_BASE}/uploads/${m.filename}`}
                  target="_blank"
                  rel="noreferrer"
                  download={m.originalName}
                  className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                  style={{
                    color: 'var(--color-neo-accent)',
                    border: '1px solid rgba(99,102,241,0.3)'
                  }}
                >
                  <Download size={14} />
                  Download
                </a>

              </motion.div>

            ))}

          </div>

        </TabsContent>

      </Tabs>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>

        <DialogContent>

          <DialogHeader>
            <DialogTitle>Upload Meeting Minutes</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4 mt-2">

            <input
              className="neo-input"
              placeholder="Title"
              value={uploadForm.title}
              onChange={(e) =>
                setUploadForm({ ...uploadForm, title: e.target.value })
              }
              required
            />

            <input
              type="date"
              className="neo-input"
              value={uploadForm.date}
              onChange={(e) =>
                setUploadForm({ ...uploadForm, date: e.target.value })
              }
              required
            />

            <input
              type="file"
              accept=".pdf"
              onChange={(e) =>
                setUploadFile(e.target.files?.[0] || null)
              }
              className="neo-input"
              required
            />

            <button
              type="submit"
              disabled={uploading}
              className="neo-btn-primary py-2"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>

          </form>

        </DialogContent>

      </Dialog>

    </div>
  );
}