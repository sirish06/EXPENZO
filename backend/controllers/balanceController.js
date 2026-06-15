const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Settlement = require('../models/Settlement');

// Smart debt simplification algorithm
const simplifyDebts = (balances) => {
  const transactions = [];
  const creditors = [];
  const debtors = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance > 0.01) creditors.push({ userId, amount: balance });
    else if (balance < -0.01) debtors.push({ userId, amount: -balance });
  }

  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const settleAmount = Math.min(creditors[i].amount, debtors[j].amount);
    transactions.push({
      from: debtors[j].userId,
      to: creditors[i].userId,
      amount: parseFloat(settleAmount.toFixed(2))
    });
    creditors[i].amount -= settleAmount;
    debtors[j].amount -= settleAmount;
    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return transactions;
};

// @desc    Get balance summary for a group (accounts for settlements)
// @route   GET /api/balances/:groupId
// @access  Private
const getBalances = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'name email preferredCurrency');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const expenses = await Expense.find({ groupId: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splitBetween.user', 'name email');

    // Fetch settlements to offset balances
    const settlements = await Settlement.find({ groupId: req.params.groupId });

    const balances = {};
    const memberMap = {};

    group.members.forEach(m => {
      balances[m._id.toString()] = 0;
      memberMap[m._id.toString()] = { _id: m._id, name: m.name, email: m.email };
    });

    // Apply expenses
    expenses.forEach(expense => {
      const paidById = expense.paidBy._id.toString();
      const expAmountINR = expense.amountInINR ?? expense.amount;

      if (balances[paidById] !== undefined) {
        balances[paidById] += expAmountINR;
      }

      expense.splitBetween.forEach(split => {
        if (!split.user) return;
        const userId = split.user._id.toString();
        const splitAmountINR = split.amountInINR ?? split.amount;
        if (balances[userId] !== undefined) {
          balances[userId] -= splitAmountINR;
        }
      });
    });

    // Apply settlements: from owes less, to is owed less
    settlements.forEach(s => {
      const fromId = s.from.toString();
      const toId = s.to.toString();
      const amt = s.amountInINR ?? s.amount;
      if (balances[fromId] !== undefined) balances[fromId] += amt;
      if (balances[toId] !== undefined) balances[toId] -= amt;
    });

    const transactions = simplifyDebts(balances);

    const enrichedTransactions = transactions.map(t => ({
      from: memberMap[t.from],
      to: memberMap[t.to],
      amount: t.amount
    }));

    const memberBalances = Object.entries(balances).map(([userId, balance]) => ({
      user: memberMap[userId],
      balance: parseFloat(balance.toFixed(2)),
      status: balance > 0.01 ? 'owed' : balance < -0.01 ? 'owes' : 'settled'
    }));

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amountInINR ?? e.amount), 0);

    res.json({
      groupId: req.params.groupId,
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      baseCurrency: 'INR',
      memberBalances,
      settlements: enrichedTransactions,
      expenseCount: expenses.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get overall balance for current user across all groups
// @route   GET /api/balances/user/summary
// @access  Private
const getUserSummary = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id });

    let totalOwed = 0;
    let totalOwing = 0;

    for (const group of groups) {
      const expenses = await Expense.find({ groupId: group._id });
      const settlements = await Settlement.find({ groupId: group._id });

      let userBalance = 0;
      expenses.forEach(expense => {
        const expINR = expense.amountInINR ?? expense.amount;
        if (expense.paidBy.toString() === req.user._id.toString()) {
          userBalance += expINR;
        }
        expense.splitBetween.forEach(split => {
          if (split.user?.toString() === req.user._id.toString()) {
            userBalance -= (split.amountInINR ?? split.amount);
          }
        });
      });

      // Apply settlements
      settlements.forEach(s => {
        if (s.from.toString() === req.user._id.toString()) userBalance += s.amountInINR ?? s.amount;
        if (s.to.toString() === req.user._id.toString()) userBalance -= s.amountInINR ?? s.amount;
      });

      if (userBalance > 0.01) totalOwed += userBalance;
      else if (userBalance < -0.01) totalOwing += Math.abs(userBalance);
    }

    res.json({
      totalOwed: parseFloat(totalOwed.toFixed(2)),
      totalOwing: parseFloat(totalOwing.toFixed(2)),
      netBalance: parseFloat((totalOwed - totalOwing).toFixed(2)),
      baseCurrency: 'INR'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBalances, getUserSummary };
