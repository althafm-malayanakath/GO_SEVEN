const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { createHttpError } = require('../utils/httpError');
const { isValidPhoneNumber, normalizePhoneNumber } = require('../utils/phone');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const serializeAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  whatsappOptIn: Boolean(user.whatsappOptIn),
  role: user.role,
  token: generateToken(user._id),
});

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const normalizeProfilePayload = (payload, { partial = false } = {}) => {
  const name = String(payload?.name || '').trim();
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || '');
  const phone = normalizePhoneNumber(payload?.phone);
  const whatsappOptIn = Boolean(payload?.whatsappOptIn);

  if (!partial || payload?.name !== undefined) {
    if (!name) {
      throw createHttpError(400, 'Name is required');
    }
  }

  if (!partial || payload?.email !== undefined) {
    if (!email) {
      throw createHttpError(400, 'Email is required');
    }
  }

  if (!partial || payload?.phone !== undefined) {
    if (!phone) {
      throw createHttpError(400, 'Phone number is required');
    }

    if (!isValidPhoneNumber(phone)) {
      throw createHttpError(400, 'Phone number must be in international format, for example +919876543210');
    }
  }

  if (!partial || payload?.password !== undefined) {
    if (!password) {
      throw createHttpError(400, 'Password is required');
    }

    if (password.length < 6) {
      throw createHttpError(400, 'Password must be at least 6 characters');
    }
  }

  return {
    ...(payload?.name !== undefined || !partial ? { name } : {}),
    ...(payload?.email !== undefined || !partial ? { email } : {}),
    ...(payload?.phone !== undefined || !partial ? { phone } : {}),
    ...(payload?.password !== undefined || !partial ? { password } : {}),
    ...(payload?.whatsappOptIn !== undefined || !partial ? { whatsappOptIn } : {}),
  };
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, phone, whatsappOptIn } = normalizeProfilePayload(req.body, { partial: false });

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw createHttpError(400, 'User already exists');
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    whatsappOptIn,
  });

  if (user) {
    res.status(201).json(serializeAuthUser(user));
  } else {
    throw createHttpError(400, 'Invalid user data');
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');

  if (!email || !password) {
    throw createHttpError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email });

  if (user && (await user.comparePassword(password))) {
    res.json(serializeAuthUser(user));
  } else {
    throw createHttpError(401, 'Invalid email or password');
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      whatsappOptIn: Boolean(user.whatsappOptIn),
      role: user.role,
    });
  } else {
    throw createHttpError(404, 'User not found');
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const updates = normalizeProfilePayload(req.body, { partial: true });

  if (updates.email && updates.email !== user.email) {
    const existingUser = await User.findOne({ email: updates.email, _id: { $ne: user._id } });

    if (existingUser) {
      throw createHttpError(400, 'Email is already in use');
    }
  }

  Object.entries(updates).forEach(([key, value]) => {
    user[key] = value;
  });

  const updatedUser = await user.save();
  res.json(serializeAuthUser(updatedUser));
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
};
