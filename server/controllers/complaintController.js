import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

// POST /api/complaints
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, department, location, severity, isAnonymous } = req.body;
    const anonymous = isAnonymous === 'true' || isAnonymous === true;

    const files = req.files?.map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      path: f.path,
    })) || [];

    const complaint = await Complaint.create({
      title,
      description,
      category,
      department,
      location,
      severity,
      isAnonymous: anonymous,
      submittedBy: req.user._id,
      submitterName: anonymous ? null : req.user.name,
      files,
    });

    res.status(201).json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/complaints
export const getComplaints = async (req, res) => {
  try {
    const { status, category, department, severity, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status)     query.status = status;
    if (category)   query.category = category;
    if (department) query.department = department;
    if (severity)   query.severity = severity;

    if (req.user.role === 'staff') {
      query.submittedBy = req.user._id;
    } else if (req.user.role === 'case_manager') {
      query.assignedTo = req.user._id;
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('submittedBy', 'name email department')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      complaints,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/complaints/:id
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('submittedBy', 'name email department')
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (
      req.user.role === 'staff' &&
      complaint.submittedBy?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (
      req.user.role === 'case_manager' &&
      complaint.assignedTo?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/complaints/track/:trackingId
export const trackComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ trackingId: req.params.trackingId })
      .populate('assignedTo', 'name')
      .select('-submittedBy -files');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/complaints/:id/assign
export const assignComplaint = async (req, res) => {
  try {
    const { caseManagerId } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const caseManager = await User.findById(caseManagerId);
    if (!caseManager) return res.status(404).json({ message: 'Case Manager not found' });

    complaint.assignedTo = caseManagerId;
    complaint.assignedToName = caseManager.name;
    complaint.assignedAt = new Date();
    complaint.status = 'Assigned';
    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('assignedTo', 'name email');

    res.json({ complaint: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/complaints/:id/status
export const updateStatus = async (req, res) => {
  try {
    const { status, note, resolution } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (
      req.user.role === 'case_manager' &&
      complaint.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not your assigned case' });
    }

    complaint.status = status;
    complaint.lastResponseAt = new Date();
    if (resolution) complaint.resolution = resolution;
    if (status === 'Resolved') complaint.resolvedAt = new Date();

    if (note) {
      complaint.notes.push({
        content: note,
        addedBy: req.user._id,
        addedByName: req.user.name,
      });
    }

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('assignedTo', 'name email');

    res.json({ complaint: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/complaints/:id/notes
export const addNote = async (req, res) => {
  try {
    const { content } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.notes.push({
      content,
      addedBy: req.user._id,
      addedByName: req.user.name,
    });
    complaint.lastResponseAt = new Date();
    await complaint.save();

    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/complaints/:id/publish
export const publishComplaint = async (req, res) => {
  try {
    const { publicSummary, actionTaken, result } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.publicSummary = publicSummary;
    complaint.actionTaken = actionTaken;
    complaint.result = result;
    complaint.isPublished = true;
    await complaint.save();

    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
