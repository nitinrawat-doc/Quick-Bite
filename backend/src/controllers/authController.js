const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    let { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.',
      });
    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();

    // Basic format checks
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check duplicate
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // SECURITY: Public registration is strictly student only. Ignore any client-sent role.
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      phone: phone ? String(phone).trim() : null,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    email = String(email).trim().toLowerCase();

    // Find user by email and explicitly select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const AdminInvite = require('../models/AdminInvite');

// POST /api/auth/setup-admin — Secure protected setup endpoint for initial/admin account creation
const setupAdmin = async (req, res, next) => {
  try {
    let { name, email, password, phone, setupToken, inviteCode } = req.body;

    const tokenToValidate = String(inviteCode || setupToken || '').trim();

    if (!tokenToValidate) {
      return res.status(403).json({
        success: false,
        message: 'Administrator authorization required. Please provide a valid invitation code or setup token.',
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();

    // Check duplicate
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Verify invitation or master token
    let matchedInvite = await AdminInvite.findOne({ code: tokenToValidate });
    let isAuthorized = false;

    if (matchedInvite) {
      if (matchedInvite.isUsed) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. This administrator invitation code has already been used.',
        });
      }
      if (matchedInvite.expiresAt < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. This administrator invitation code has expired.',
        });
      }
      if (matchedInvite.invitedEmail && matchedInvite.invitedEmail !== email) {
        return res.status(403).json({
          success: false,
          message: `Forbidden. This invitation code is restricted to ${matchedInvite.invitedEmail}.`,
        });
      }
      isAuthorized = true;
    } else {
      // Server-side fallback secret for initial provisioning
      const expectedToken =
        process.env.ADMIN_SETUP_TOKEN ||
        process.env.ADMIN_SETUP_SECRET ||
        'quickbite_admin_setup_secret_2026';

      if (tokenToValidate === expectedToken) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Invalid administrator setup token or invitation code.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'admin',
      phone: phone ? String(phone).trim() : null,
    });

    // If an AdminInvite was used, mark it as redeemed
    if (matchedInvite) {
      matchedInvite.isUsed = true;
      matchedInvite.usedBy = user._id;
      matchedInvite.usedAt = new Date();
      await matchedInvite.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Administrator account created successfully.',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me (Protected)
const getProfile = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
      },
    },
  });
};

// PUT /api/auth/profile (Protected)
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = String(name).trim();
    if (phone !== undefined) user.phone = phone ? String(phone).trim() : null;

    // Security: user.role cannot be updated via this endpoint
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  setupAdmin,
  getProfile,
  updateProfile,
};
