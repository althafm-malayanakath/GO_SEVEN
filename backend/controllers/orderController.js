const mongoose = require('mongoose');
const Order = require('../models/Order');
const { createHttpError } = require('../utils/httpError');
const { isValidPhoneNumber, normalizePhoneNumber } = require('../utils/phone');
const {
  notifyAdminOrderPlaced,
  notifyCustomerOrderPlaced,
} = require('../services/whatsappService');

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const validateObjectId = (value, resourceName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createHttpError(400, `Invalid ${resourceName} id`);
  }
};

const normalizeShippingAddress = (shippingAddress) => {
  const address = String(shippingAddress?.address || '').trim();
  const city = String(shippingAddress?.city || '').trim();
  const postalCode = String(shippingAddress?.postalCode || '').trim();
  const country = String(shippingAddress?.country || '').trim();

  if (!address || !city || !postalCode || !country) {
    throw createHttpError(400, 'Complete shipping address is required');
  }

  return { address, city, postalCode, country };
};

const normalizeOrderItems = (orderItems) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw createHttpError(400, 'No order items');
  }

  return orderItems.map((item) => {
    const name = String(item?.name || '').trim();
    const image = String(item?.image || '').trim();
    const product = String(item?.product || '').trim();
    const qty = Number(item?.qty);
    const price = Number(item?.price);
    const size = item?.size ? String(item.size).trim() : undefined;
    const color = item?.color ? String(item.color).trim() : undefined;

    if (!name || !image || !product || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) {
      throw createHttpError(400, 'Each order item must include name, image, product, quantity, and price');
    }

    validateObjectId(product, 'product');

    return {
      name,
      image,
      product,
      qty,
      price,
      ...(size ? { size } : {}),
      ...(color ? { color } : {}),
    };
  });
};

const normalizeMoney = (value, fieldName) => {
  const normalized = Number(value);

  if (!Number.isFinite(normalized) || normalized < 0) {
    throw createHttpError(400, `${fieldName} must be greater than or equal to 0`);
  }

  return normalized;
};

const applyNotificationResult = (target, result) => {
  target.attempted = Boolean(result.attempted);
  target.sent = Boolean(result.sent);
  target.sid = result.sid || undefined;
  target.error = result.error || undefined;
  target.sentAt = result.sentAt || undefined;
};

const assertOrderAccess = (order, user) => {
  if (!order) {
    throw createHttpError(404, 'Order not found');
  }

  if (user.role === 'admin') {
    return;
  }

  const orderUserId = order.user?._id || order.user;

  if (!orderUserId || String(orderUserId) !== String(user._id)) {
    throw createHttpError(403, 'Not authorized to access this order');
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    customerPhone,
    whatsappOptIn,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;
  const normalizedOrderItems = normalizeOrderItems(orderItems);
  const normalizedShippingAddress = normalizeShippingAddress(shippingAddress);
  const normalizedCustomerPhone = normalizePhoneNumber(customerPhone || req.user.phone);
  const normalizedPaymentMethod = String(paymentMethod || '').trim();
  const normalizedWhatsappOptIn = whatsappOptIn === undefined ? Boolean(req.user.whatsappOptIn) : Boolean(whatsappOptIn);

  if (!normalizedCustomerPhone || !isValidPhoneNumber(normalizedCustomerPhone)) {
    throw createHttpError(400, 'Customer phone number must be in international format, for example +919876543210');
  }

  if (!normalizedPaymentMethod) {
    throw createHttpError(400, 'Payment method is required');
  }

  const order = new Order({
    orderItems: normalizedOrderItems,
    user: req.user._id,
    customerName: req.user.name,
    customerPhone: normalizedCustomerPhone,
    whatsappOptIn: normalizedWhatsappOptIn,
    shippingAddress: normalizedShippingAddress,
    paymentMethod: normalizedPaymentMethod,
    itemsPrice: normalizeMoney(itemsPrice, 'itemsPrice'),
    taxPrice: normalizeMoney(taxPrice, 'taxPrice'),
    shippingPrice: normalizeMoney(shippingPrice, 'shippingPrice'),
    totalPrice: normalizeMoney(totalPrice, 'totalPrice'),
  });

  const createdOrder = await order.save();

  const [customerNotification, adminNotification] = await Promise.all([
    notifyCustomerOrderPlaced(createdOrder),
    notifyAdminOrderPlaced(createdOrder),
  ]);

  createdOrder.notifications = createdOrder.notifications || {};
  createdOrder.notifications.customer = createdOrder.notifications.customer || {};
  createdOrder.notifications.admin = createdOrder.notifications.admin || {};

  applyNotificationResult(createdOrder.notifications.customer, customerNotification);
  applyNotificationResult(createdOrder.notifications.admin, adminNotification);

  await createdOrder.save();
  res.status(201).json(createdOrder);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'name email phone whatsappOptIn')
    .sort({ createdAt: -1 });

  res.json(orders);
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  validateObjectId(req.params.id, 'order');

  const order = await Order.findById(req.params.id).populate('user', 'name email');
  assertOrderAccess(order, req.user);

  res.json(order);
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  validateObjectId(req.params.id, 'order');

  const order = await Order.findById(req.params.id);
  assertOrderAccess(order, req.user);

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.email_address,
  };

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  validateObjectId(req.params.id, 'order');

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw createHttpError(404, 'Order not found');
  }

  const nextStatus = String(req.body?.status || '').trim();

  if (!ORDER_STATUSES.includes(nextStatus)) {
    throw createHttpError(400, `status must be one of: ${ORDER_STATUSES.join(', ')}`);
  }

  order.status = nextStatus;
  order.isDelivered = nextStatus === 'Delivered';
  order.deliveredAt = nextStatus === 'Delivered' ? new Date() : undefined;

  const updatedOrder = await order.save();
  await updatedOrder.populate('user', 'name email');
  res.json(updatedOrder);
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

module.exports = {
  ORDER_STATUSES,
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  updateOrderToPaid,
};
