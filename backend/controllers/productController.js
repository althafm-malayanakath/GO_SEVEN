const Product = require('../models/Product');
const mongoose = require('mongoose');
const { createHttpError } = require('../utils/httpError');
const { destroyManagedAsset } = require('../utils/storage');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeString = (value, fieldName, { required = false } = {}) => {
  if (value === undefined || value === null) {
    if (required) {
      throw createHttpError(400, `${fieldName} is required`);
    }

    return undefined;
  }

  const normalized = String(value).trim();

  if (required && !normalized) {
    throw createHttpError(400, `${fieldName} is required`);
  }

  return normalized;
};

const normalizeNumber = (value, fieldName, { required = false, min = 0 } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw createHttpError(400, `${fieldName} is required`);
    }

    return undefined;
  }

  const normalized = Number(value);

  if (!Number.isFinite(normalized) || normalized < min) {
    throw createHttpError(400, `${fieldName} must be a number greater than or equal to ${min}`);
  }

  return normalized;
};

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }

  if (value === undefined) {
    return fallback;
  }

  return Boolean(value);
};

const normalizeSizes = (sizes, { required = false } = {}) => {
  if (sizes === undefined) {
    return required ? [] : undefined;
  }

  if (!Array.isArray(sizes)) {
    throw createHttpError(400, 'sizes must be an array');
  }

  return sizes
    .map((size) => String(size || '').trim())
    .filter(Boolean);
};

const normalizeColors = (colors, { required = false } = {}) => {
  if (colors === undefined) {
    return required ? [] : undefined;
  }

  if (!Array.isArray(colors)) {
    throw createHttpError(400, 'colors must be an array');
  }

  return colors
    .map((color) => {
      const name = String(color?.name || '').trim();
      const hex = String(color?.hex || '').trim();

      if (!name || !hex) {
        return null;
      }

      return { name, hex };
    })
    .filter(Boolean);
};

const normalizeImages = (images, { required = false } = {}) => {
  if (images === undefined) {
    if (required) {
      throw createHttpError(400, 'At least one product image is required');
    }

    return undefined;
  }

  if (!Array.isArray(images)) {
    throw createHttpError(400, 'images must be an array');
  }

  const normalizedImages = images
    .map((image) => {
      const url = String(image?.url || '').trim();
      const publicId = image?.public_id ? String(image.public_id).trim() : undefined;

      if (!url) {
        return null;
      }

      return {
        url,
        ...(publicId ? { public_id: publicId } : {}),
      };
    })
    .filter(Boolean);

  if (required && normalizedImages.length === 0) {
    throw createHttpError(400, 'At least one product image is required');
  }

  return normalizedImages;
};

const normalizeModel3D = (model3D) => {
  if (model3D === undefined || model3D === null) {
    return undefined;
  }

  const url = String(model3D?.url || '').trim();
  const publicId = model3D?.public_id ? String(model3D.public_id).trim() : undefined;

  if (!url) {
    return null;
  }

  return {
    url,
    ...(publicId ? { public_id: publicId } : {}),
  };
};

const normalizeProductPayload = (payload, { partial = false } = {}) => {
  const normalized = {};

  const name = normalizeString(payload?.name, 'name', { required: !partial });
  const description = normalizeString(payload?.description, 'description', { required: !partial });
  const category = normalizeString(payload?.category, 'category', { required: !partial });
  const price = normalizeNumber(payload?.price, 'price', { required: !partial });
  const stock = normalizeNumber(payload?.stock, 'stock', { required: !partial });
  const sizes = normalizeSizes(payload?.sizes, { required: !partial });
  const colors = normalizeColors(payload?.colors, { required: !partial });
  const images = normalizeImages(payload?.images, { required: !partial });
  const model3D = normalizeModel3D(payload?.model3D);

  if (name !== undefined) normalized.name = name;
  if (description !== undefined) normalized.description = description;
  if (category !== undefined) normalized.category = category;
  if (price !== undefined) normalized.price = price;
  if (stock !== undefined) normalized.stock = stock;
  if (sizes !== undefined) normalized.sizes = sizes;
  if (colors !== undefined) normalized.colors = colors;
  if (images !== undefined) normalized.images = images;
  if (payload?.model3D !== undefined) normalized.model3D = model3D;
  if (payload?.isNewArrival !== undefined || !partial) {
    normalized.isNewArrival = normalizeBoolean(payload?.isNewArrival, false);
  }
  if (payload?.isFeatured !== undefined || !partial) {
    normalized.isFeatured = normalizeBoolean(payload?.isFeatured, false);
  }

  if (payload?.discount !== undefined) {
    const d = Number(payload.discount);
    normalized.discount = Number.isFinite(d) ? Math.min(100, Math.max(0, d)) : 0;
  }

  if (payload?.discountEndsAt !== undefined) {
    normalized.discountEndsAt = payload.discountEndsAt ? new Date(payload.discountEndsAt) : null;
  }

  return normalized;
};

const validateObjectId = (value, resourceName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createHttpError(400, `Invalid ${resourceName} id`);
  }
};

const removeManagedAssets = async (publicIds) => {
  await Promise.all(
    publicIds
      .filter(Boolean)
      .map((publicId) => destroyManagedAsset(publicId).catch(() => undefined))
  );
};

const getRemovedAssetIds = (currentAssets = [], nextAssets = []) => {
  const nextPublicIds = new Set(
    nextAssets
      .map((asset) => asset?.public_id)
      .filter(Boolean)
  );

  return currentAssets
    .map((asset) => asset?.public_id)
    .filter((publicId) => publicId && !nextPublicIds.has(publicId));
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  const query = {};

  if (req.query.category) {
    query.category = { $regex: `^${escapeRegex(String(req.query.category).trim())}$`, $options: 'i' };
  }

  if (req.query.search) {
    query.name = { $regex: escapeRegex(String(req.query.search).trim()), $options: 'i' };
  }

  if (req.query.featured === 'true') {
    query.isFeatured = true;
  }

  if (req.query.new === 'true' || req.query.isNewArrival === 'true') {
    query.isNewArrival = true;
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1, numReviews: -1 },
    name: { name: 1 },
  };

  const sort = sortOptions[req.query.sort] || { createdAt: -1 };
  const products = await Product.find(query).sort(sort);

  res.json(products);
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  validateObjectId(req.params.id, 'product');
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    throw createHttpError(404, 'Product not found');
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const productPayload = normalizeProductPayload(req.body, { partial: false });

  const product = new Product({
    ...productPayload,
    user: req.user._id,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  validateObjectId(req.params.id, 'product');

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createHttpError(404, 'Product not found');
  }

  const updates = normalizeProductPayload(req.body, { partial: true });
  const removableAssets = [];

  if (!product.user) {
    product.user = req.user._id;
  }

  if (updates.images !== undefined) {
    removableAssets.push(...getRemovedAssetIds(product.images, updates.images));
  }

  if (updates.model3D !== undefined && product.model3D?.public_id && product.model3D.public_id !== updates.model3D?.public_id) {
    removableAssets.push(product.model3D.public_id);
  }

  Object.entries(updates).forEach(([key, value]) => {
    product[key] = value;
  });

  const updatedProduct = await product.save();
  await removeManagedAssets(removableAssets);
  res.json(updatedProduct);
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  validateObjectId(req.params.id, 'product');

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createHttpError(404, 'Product not found');
  }

  const removableAssets = [
    ...product.images.map((image) => image?.public_id).filter(Boolean),
    product.model3D?.public_id,
  ];

  await product.deleteOne();
  await removeManagedAssets(removableAssets);

  res.json({ message: 'Product removed' });
};

const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) throw createHttpError(400, 'Rating and comment are required');

  const product = await Product.findById(req.params.id);
  if (!product) throw createHttpError(404, 'Product not found');

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) throw createHttpError(400, 'You already reviewed this product');

  product.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

  await product.save();
  res.status(201).json({ message: 'Review added' });
};

const getReviews = async (req, res) => {
  const product = await Product.findById(req.params.id).select('reviews numReviews rating');
  if (!product) throw createHttpError(404, 'Product not found');
  res.json({ reviews: product.reviews, numReviews: product.numReviews, rating: product.rating });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
  getReviews,
};
