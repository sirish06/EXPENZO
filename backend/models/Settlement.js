const mongoose = require('mongoose');
const { CURRENCY_CODES } = require('../config/currencies');

const settlementSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  amountInINR: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: CURRENCY_CODES,
    default: 'INR'
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  settledAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);
