import Complaint from '../models/Complaint.js';

// GET /api/analytics/overview
export const getOverview = async (req, res) => {
  try {
    const [total, escalated, resolved, byStatus, byCategory, bySeverity] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Escalated' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.aggregate([{ $group: { _id: '$status',   count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    ]);

    res.json({ total, escalated, resolved, byStatus, byCategory, bySeverity });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/analytics/heatmap
export const getHeatmap = async (req, res) => {
  try {
    const [heatmap, departmentTotals] = await Promise.all([
      Complaint.aggregate([
        {
          $group: {
            _id:   { department: '$department', category: '$category' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$department', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.json({ heatmap, departmentTotals });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/analytics/hotspots
export const getHotspots = async (req, res) => {
  try {
    const hotspots = await Complaint.aggregate([
      {
        $group: {
          _id:        { department: '$department', category: '$category' },
          count:      { $sum: 1 },
          complaints: { $push: '$trackingId' },
        },
      },
      { $match: { count: { $gte: 5 } } },
      { $sort:  { count: -1 } },
    ]);

    res.json({ hotspots });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/analytics/case-manager-stats
export const getCaseManagerStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: { assignedTo: { $exists: true, $ne: null } } },
      {
        $group: {
          _id:         { managerId: '$assignedTo', status: '$status' },
          count:       { $sum: 1 },
          managerName: { $first: '$assignedToName' },
        },
      },
    ]);

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
