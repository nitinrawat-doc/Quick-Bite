const AdminInvite = require('../models/AdminInvite');

// POST /api/admin/invites — Generate a new single-use admin invitation code
const createInvite = async (req, res, next) => {
  try {
    const { invitedEmail, expiresInHours = 48, note } = req.body;

    const hours = Math.max(1, Math.min(168, Number(expiresInHours) || 48)); // between 1h and 7 days
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    const code = AdminInvite.generateCode();

    const invite = await AdminInvite.create({
      code,
      createdBy: req.user?._id || null,
      invitedEmail: invitedEmail ? String(invitedEmail).trim().toLowerCase() : null,
      expiresAt,
      note: note ? String(note).trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Admin invitation code generated successfully.',
      data: invite,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/invites — View list of generated invitations
const listInvites = async (req, res, next) => {
  try {
    const invites = await AdminInvite.find()
      .populate('createdBy', 'name email')
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    const now = new Date();
    const formatted = invites.map((inv) => {
      const obj = inv.toObject();
      obj.isExpired = !obj.isUsed && obj.expiresAt < now;
      obj.status = obj.isUsed ? 'used' : obj.isExpired ? 'expired' : 'active';
      return obj;
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/invites/:id — Revoke/cancel an unused invite
const revokeInvite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invite = await AdminInvite.findById(id);

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found.',
      });
    }

    if (invite.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot revoke an invitation that has already been redeemed.',
      });
    }

    await AdminInvite.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Invitation revoked successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInvite,
  listInvites,
  revokeInvite,
};
