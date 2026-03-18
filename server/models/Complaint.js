import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedByName: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Safety', 'Policy', 'Facilities', 'HR', 'Other'],
    required: true,
  },
  department: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  status: {
    type: String,
    enum: ['New', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Escalated'],
    default: 'New',
  },
  isAnonymous: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submitterName: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedToName: { type: String },
  assignedAt: { type: Date },
  lastResponseAt: { type: Date },
  escalationReminderSent: { type: Boolean, default: false },
  escalatedAt: { type: Date },
  files: [{ filename: String, originalName: String, mimetype: String, path: String }],
  notes: [noteSchema],
  resolution: { type: String },
  resolvedAt: { type: Date },
  publicSummary: { type: String },
  actionTaken: { type: String },
  result: { type: String },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

complaintSchema.pre('save', async function () {
  if (this.trackingId) return;

  const year = new Date().getFullYear();
  const prefix = `NEO-${year}-`;

  const lastComplaint = await mongoose.model('Complaint').findOne(
    { trackingId: { $regex: `^${prefix}` } },
    { trackingId: 1 },
    { sort: { trackingId: -1 } }
  );

  let nextNum = 1;
  if (lastComplaint) {
    const lastNum = parseInt(lastComplaint.trackingId.split('-')[2], 10);
    nextNum = lastNum + 1;
  }

  this.trackingId = `${prefix}${String(nextNum).padStart(3, '0')}`;
});

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
