const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createHttpError } = require('../utils/httpError');

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const hasBearerToken = authorization.startsWith('Bearer ');

  if (!hasBearerToken) {
    return next(createHttpError(401, 'Not authorized, no token'));
  }

  try {
    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(createHttpError(401, 'Not authorized, user not found'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(createHttpError(401, 'Not authorized, token failed'));
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return next(createHttpError(403, 'Not authorized as an admin'));
};

module.exports = { protect, admin };
