import User from '../models/User.js';

// GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/users/case-managers
export const getCaseManagers = async (req, res) => {
  try {
    const caseManagers = await User.find({ role: 'case_manager', isActive: true })
      .select('-password');
    res.json({ users: caseManagers });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, department, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, isActive },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/users/:id (sets isActive: false)
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { returnDocument: 'after' }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
