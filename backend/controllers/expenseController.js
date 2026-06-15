const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const ActivityLog = require('../models/ActivityLog');
const { convertToINR } = require('../config/currencies');

// @desc    Add an expense to a group
// @route   POST /api/expenses/add
// @access  Private
const addExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title, amount, groupId, splitType = 'equal',
    splitBetween, category = 'other', date, currency = 'INR',
    notes = '', paidBy: paidByParam
  } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'You are not a member of this group' });

    // Determine who paid — must be a group member
    const paidById = paidByParam || req.user._id.toString();
    const paidByIsMember = group.members.some(m => m.toString() === paidById.toString());
    if (!paidByIsMember) {
      return res.status(400).json({ message: 'Paid-by user must be a group member' });
    }

    const amountNum = parseFloat(amount);
    const amountInINR = convertToINR(amountNum, currency);
    let finalSplit = splitBetween;

    // ── Equal split ──────────────────────────────────────────────────────────
    if (splitType === 'equal') {
      const memberIds = splitBetween && splitBetween.length > 0
        ? splitBetween.map(s => s.user)
        : group.members.map(m => m.toString());

      const perPerson = parseFloat((amountNum / memberIds.length).toFixed(2));
      const perPersonINR = convertToINR(perPerson, currency);
      finalSplit = memberIds.map(userId => ({
        user: userId,
        amount: perPerson,
        amountInINR: perPersonINR,
        percentage: parseFloat((100 / memberIds.length).toFixed(2)),
        shares: 1
      }));
    }

    // ── Custom (exact amounts) ────────────────────────────────────────────────
    if (splitType === 'custom') {
      const total = splitBetween.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
      if (Math.abs(total - amountNum) > 0.01) {
        return res.status(400).json({ message: `Split amounts (${total.toFixed(2)}) don't match total (${amountNum})` });
      }
      finalSplit = splitBetween.map(s => ({
        ...s,
        amountInINR: convertToINR(parseFloat(s.amount || 0), currency),
        percentage: parseFloat(((parseFloat(s.amount || 0) / amountNum) * 100).toFixed(2)),
        shares: 1
      }));
    }

    // ── Percentage split ──────────────────────────────────────────────────────
    if (splitType === 'percentage') {
      const totalPct = splitBetween.reduce((sum, s) => sum + parseFloat(s.percentage || 0), 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        return res.status(400).json({ message: 'Percentages must add up to 100%' });
      }
      finalSplit = splitBetween.map(s => {
        const splitAmount = parseFloat(((parseFloat(s.percentage) / 100) * amountNum).toFixed(2));
        return {
          ...s,
          amount: splitAmount,
          amountInINR: convertToINR(splitAmount, currency),
          shares: 1
        };
      });
    }

    // ── Shares (ratio-based) ──────────────────────────────────────────────────
    if (splitType === 'shares') {
      const totalShares = splitBetween.reduce((sum, s) => sum + parseFloat(s.shares || 1), 0);
      if (totalShares <= 0) {
        return res.status(400).json({ message: 'Total shares must be greater than 0' });
      }
      finalSplit = splitBetween.map(s => {
        const userShares = parseFloat(s.shares || 1);
        const splitAmount = parseFloat(((userShares / totalShares) * amountNum).toFixed(2));
        return {
          ...s,
          amount: splitAmount,
          amountInINR: convertToINR(splitAmount, currency),
          percentage: parseFloat(((userShares / totalShares) * 100).toFixed(2)),
          shares: userShares
        };
      });
    }

    const expense = await Expense.create({
      title,
      amount: amountNum,
      currency,
      amountInINR,
      paidBy: paidById,
      createdBy: req.user._id,
      groupId,
      splitType,
      splitBetween: finalSplit,
      category,
      notes,
      date: date || new Date()
    });

    // Log activity
    await ActivityLog.create({
      groupId,
      user: req.user._id,
      action: 'expense_added',
      details: { title, amount: amountNum, currency, amountInINR, category }
    });

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('splitBetween.user', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all expenses for a group (with optional filters)
// @route   GET /api/expenses/:groupId
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const filter = { groupId: req.params.groupId };

    // Optional filters via query params
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    if (req.query.paidBy && req.query.paidBy !== 'all') {
      filter.paidBy = req.query.paidBy;
    }

    const expenses = await Expense.find(filter)
      .populate('paidBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('splitBetween.user', 'name email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an expense (creator or admin)
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  const { title, amount, splitType, splitBetween, category, date, currency, notes, paidBy: paidByParam } = req.body;

  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    // Check permission: expense creator OR group admin
    const group = await Group.findById(expense.groupId);
    const isAdmin = group && group.createdBy.toString() === req.user._id.toString();
    const isCreator = expense.createdBy?.toString() === req.user._id.toString()
      || expense.paidBy?.toString() === req.user._id.toString(); // fallback for old data

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Only the expense creator or group admin can edit this expense' });
    }

    const effectiveCurrency = currency || expense.currency || 'INR';
    const effectiveAmount = amount !== undefined ? parseFloat(amount) : expense.amount;

    expense.title = title || expense.title;
    expense.amount = effectiveAmount;
    expense.currency = effectiveCurrency;
    expense.amountInINR = convertToINR(effectiveAmount, effectiveCurrency);
    expense.splitType = splitType || expense.splitType;
    expense.category = category || expense.category;
    expense.date = date || expense.date;
    expense.notes = notes !== undefined ? notes : expense.notes;

    if (paidByParam) {
      const paidByIsMember = group.members.some(m => m.toString() === paidByParam.toString());
      if (!paidByIsMember) return res.status(400).json({ message: 'Paid-by user must be a group member' });
      expense.paidBy = paidByParam;
    }

    if (splitBetween) {
      expense.splitBetween = splitBetween.map(s => ({
        ...s,
        amountInINR: convertToINR(parseFloat(s.amount || 0), effectiveCurrency)
      }));
    }

    await expense.save();

    // Log activity
    await ActivityLog.create({
      groupId: expense.groupId,
      user: req.user._id,
      action: 'expense_updated',
      details: { title: expense.title, amount: expense.amount, currency: expense.currency }
    });

    const updated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('splitBetween.user', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an expense (creator or admin)
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const group = await Group.findById(expense.groupId);
    const isAdmin = group && group.createdBy.toString() === req.user._id.toString();
    const isCreator = expense.createdBy?.toString() === req.user._id.toString()
      || expense.paidBy?.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Only the expense creator or group admin can delete this expense' });
    }

    const { title, amount, currency, groupId } = expense;
    await Expense.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      groupId,
      user: req.user._id,
      action: 'expense_deleted',
      details: { title, amount, currency }
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addExpense, getExpenses, updateExpense, deleteExpense };
