const ActivityLog = require('../models/ActivityLog');
const Group = require('../models/Group');

// @desc    Get activity feed for a specific group
// @route   GET /api/activity/:groupId
// @access  Private
const getGroupActivity = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const activities = await ActivityLog.find({ groupId: req.params.groupId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get global activity feed for current user (all groups)
// @route   GET /api/activity/user/feed
// @access  Private
const getUserActivityFeed = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).select('_id');
    const groupIds = groups.map(g => g._id);

    const activities = await ActivityLog.find({ groupId: { $in: groupIds } })
      .populate('user', 'name email')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGroupActivity, getUserActivityFeed };
