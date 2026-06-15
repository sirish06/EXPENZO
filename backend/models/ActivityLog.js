const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'expense_added',
      'expense_updated',
      'expense_deleted',
      'settlement_created',
      'member_joined',
      'member_left',
      'member_removed',
      'group_created',
      'group_updated'
    ],
    required: true
  },
  // Flexible details object — stores amount, title, currency, etc.
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Index for fast per-group queries sorted by date
activityLogSchema.index({ groupId: 1, createdAt: -1 });
// Index for per-user queries
activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
