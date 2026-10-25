const mongoose = require('mongoose');
const crypto = require('crypto');

const adminInviteSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // can be null for system-provisioned invites
    },
    invitedEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Helper static to generate a cryptographically secure invite code
adminInviteSchema.statics.generateCode = function () {
  return `qb_inv_${crypto.randomBytes(16).toString('hex')}`;
};

module.exports = mongoose.model('AdminInvite', adminInviteSchema);
