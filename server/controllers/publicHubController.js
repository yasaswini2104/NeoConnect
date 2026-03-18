import Complaint from '../models/Complaint.js';
import MeetingMinutes from '../models/MeetingMinutes.js';

// GET /api/public-hub/digest
export const getDigest = async (req, res) => {
  try {
    const { quarter, year } = req.query;
    const query = { isPublished: true, status: 'Resolved' };

    if (year && quarter) {
      const startMonth = (parseInt(quarter) - 1) * 3;
      const start = new Date(parseInt(year), startMonth, 1);
      const end   = new Date(parseInt(year), startMonth + 3, 0);
      query.resolvedAt = { $gte: start, $lte: end };
    }

    const complaints = await Complaint.find(query)
      .select('trackingId category department publicSummary actionTaken result resolvedAt')
      .sort({ resolvedAt: -1 })
      .limit(20);

    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/public-hub/impact
export const getImpact = async (req, res) => {
  try {
    const impacts = await Complaint.find({ isPublished: true, status: 'Resolved' })
      .select('trackingId category department publicSummary actionTaken result resolvedAt')
      .sort({ resolvedAt: -1 });

    res.json({ impacts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/public-hub/minutes
export const uploadMinutes = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File required' });

    const { title, description, date, tags } = req.body;

    const minutes = await MeetingMinutes.create({
      title,
      description,
      date: new Date(date),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      uploadedBy: req.user._id,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
    });

    res.status(201).json({ minutes });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/public-hub/minutes
export const getMinutes = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const total   = await MeetingMinutes.countDocuments(query);
    const minutes = await MeetingMinutes.find(query)
      .populate('uploadedBy', 'name')
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      minutes,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
