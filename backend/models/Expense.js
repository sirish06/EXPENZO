const mongoose = require('mongoose');
const { CURRENCY_CODES } = require('../config/currencies');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  // currency in which the expense was entered
  currency: {
    type: String,
    enum: CURRENCY_CODES,
    default: 'INR'
  },
  // amount converted to INR for balance calculations
  amountInINR: {
    type: Number,
    min: 0
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // who added this expense (for permissions)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  splitType: {
    type: String,
    enum: ['equal', 'custom', 'percentage', 'shares'],
    default: 'equal'
  },
  // splitBetween: array of { user, amount, amountInINR, percentage, shares }
  splitBetween: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // share in original currency
    amount: {
      type: Number,
      default: 0
    },
    // share converted to INR
    amountInINR: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    // for shares/ratio-based split
    shares: {
      type: Number,
      default: 1
    }
  }],
  category: {
    type: String,
    enum: ['food', 'travel', 'rent', 'party', 'shopping', 'utilities', 'other'],
    default: 'other'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
