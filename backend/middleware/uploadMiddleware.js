const multer = require('multer');
const { createHttpError } = require('../utils/httpError');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype.startsWith('image/')) {
      callback(createHttpError(400, 'Only image files are allowed'));
      return;
    }

    callback(null, true);
  },
});

const uploadSingleImage = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(createHttpError(400, 'Image must be 8MB or smaller'));
      return;
    }

    next(error.statusCode ? error : createHttpError(400, error.message || 'Upload failed'));
  });
};

module.exports = { uploadSingleImage };
