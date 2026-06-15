const crypto = require('crypto');
const { validationResult } = require('express-validator');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const ActivityLog = require('../models/ActivityLog');

// Helper to generate unique 8-char invite code
const generateInviteCode = async () => {
  let code, exists;
  do {
    code = crypto.randomBytes(4).toString('hex').toUpperCase();
    exists = await Group.findOne({ inviteCode: code });
  } while (exists);
  return code;
};

// @desc    Create a new group
// @route   POST /api/groups/create
// @access  Private
const createGroup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, members } = req.body;

  try {
    const inviteCode = await generateInviteCode();
    const allMembers = [...new Set([req.user._id.toString(), ...(members || [])])];

    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: allMembers,
      inviteCode
    });

    // Log activity
    await ActivityLog.create({
      groupId: group._id,
      user: req.user._id,
      action: 'group_created',
      details: { groupName: name }
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email preferredCurrency')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a group via invite code
// @route   POST /api/groups/join
// @access  Private
const joinByInviteCode = async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });

  try {
    const group = await Group.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!group) return res.status(404).json({ message: 'Invalid invite code. No group found.' });

    // Already a member?
    if (group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    group.members.push(req.user._id);
    await group.save();

    // Log activity
    await ActivityLog.create({
      groupId: group._id,
      user: req.user._id,
      action: 'member_joined',
      details: { memberName: req.user.name }
    });

    const populated = await Group.findById(group._id)
      .populate('members', 'name email preferredCurrency')
      .populate('createdBy', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all groups for current user
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email preferredCurrency')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single group by ID
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email preferredCurrency')
      .populate('createdBy', 'name email');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const isAdmin = group.createdBy._id.toString() === req.user._id.toString();
    const groupObj = group.toObject();

    // Only admins can see invite code
    if (!isAdmin) delete groupObj.inviteCode;

    res.json(groupObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update group details (admin only)
// @route   PUT /api/groups/:id
// @access  Private
const updateGroup = async (req, res) => {
  const { name, description, members } = req.body;

  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group admin can update the group' });
    }

    // Always include creator
    const allMembers = members
      ? [...new Set([req.user._id.toString(), ...members])]
      : group.members.map(m => m.toString());

    group.name = name || group.name;
    group.description = description !== undefined ? description : group.description;
    group.members = allMembers;

    await group.save();

    // Log activity
    await ActivityLog.create({
      groupId: group._id,
      user: req.user._id,
      action: 'group_updated',
      details: { groupName: group.name }
    });

    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email preferredCurrency')
      .populate('createdBy', 'name email');

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete group (admin only)
// @route   DELETE /api/groups/:id
// @access  Private
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group admin can delete the group' });
    }

    await Expense.deleteMany({ groupId: req.params.id });
    await Settlement.deleteMany({ groupId: req.params.id });
    await ActivityLog.deleteMany({ groupId: req.params.id });
    await Group.findByIdAndDelete(req.params.id);

    res.json({ message: 'Group and all its data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Regenerate invite code (admin only)
// @route   POST /api/groups/:id/regen-invite
// @access  Private
const regenerateInviteCode = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group admin can regenerate the invite code' });
    }

    group.inviteCode = await generateInviteCode();
    await group.save();

    res.json({ inviteCode: group.inviteCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a member from group (admin only)
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group admin can remove members' });
    }

    if (req.params.userId === group.createdBy.toString()) {
      return res.status(400).json({ message: 'Cannot remove the group admin' });
    }

    const memberExists = group.members.some(m => m.toString() === req.params.userId);
    if (!memberExists) return res.status(404).json({ message: 'Member not found in this group' });

    group.members = group.members.filter(m => m.toString() !== req.params.userId);
    await group.save();

    // Log activity
    await ActivityLog.create({
      groupId: group._id,
      user: req.user._id,
      action: 'member_removed',
      details: { removedUserId: req.params.userId }
    });

    const updated = await Group.findById(group._id)
      .populate('members', 'name email preferredCurrency')
      .populate('createdBy', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave a group (non-admin members)
// @route   POST /api/groups/:id/leave
// @access  Private
const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(400).json({ message: 'You are not a member of this group' });

    if (group.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot leave the group. Transfer ownership first or delete the group.' });
    }

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();

    // Log activity
    await ActivityLog.create({
      groupId: group._id,
      user: req.user._id,
      action: 'member_left',
      details: { memberName: req.user.name }
    });

    res.json({ message: 'You have left the group successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGroup, joinByInviteCode, getGroups, getGroupById,
  updateGroup, deleteGroup, regenerateInviteCode, removeMember, leaveGroup
};
