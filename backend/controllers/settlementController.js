const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const ActivityLog = require('../models/ActivityLog');
const { convertToINR } = require('../config/currencies');

// @desc    Create a settlement (mark balance as paid)
// @route   POST /api/settlements
// @access  Private
const createSettlement = async (req, res) => {
  const { groupId, to, amount, currency = 'INR', note } = req.body;

  if (!groupId || !to || !amount) {
    return res.status(400).json({ message: 'groupId, to, and amount are required' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const amountInINR = convertToINR(parseFloat(amount), currency);

    const settlement = await Settlement.create({
      groupId,
      from: req.user._id,
      to,
      amount: parseFloat(amount),
      amountInINR,
      currency,
      note: note || ''
    });

    // Log activity
    await ActivityLog.create({
      groupId,
      user: req.user._id,
      action: 'settlement_created',
      details: {
        to,
        amount: parseFloat(amount),
        amountInINR,
        currency
      }
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('from', 'name email')
      .populate('to', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get settlement history for a group
// @route   GET /api/settlements/:groupId
// @access  Private
const getGroupSettlements = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const settlements = await Settlement.find({ groupId: req.params.groupId })
      .populate('from', 'name email')
      .populate('to', 'name email')
      .sort({ settledAt: -1 });

    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSettlement, getGroupSettlements };
