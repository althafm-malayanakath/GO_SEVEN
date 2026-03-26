const { createHttpError } = require('../utils/httpError');
const { uploadImage } = require('../utils/storage');

const buildAbsoluteUrl = (req, url) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${req.protocol}://${req.get('host')}${url}`;
};

// @desc    Upload a product image
// @route   POST /api/uploads/images
// @access  Private/Admin
const uploadProductImage = async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, 'Image file is required');
  }

  const asset = await uploadImage({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    folder: 'products',
  });

  res.status(201).json({
    url: buildAbsoluteUrl(req, asset.url),
    public_id: asset.public_id,
    storage: asset.storage,
    originalName: req.file.originalname,
  });
};

module.exports = {
  uploadProductImage,
};
