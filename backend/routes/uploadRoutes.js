const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');
const { uploadProductImage } = require('../controllers/uploadController');

const router = express.Router();

router.post('/images', protect, admin, uploadSingleImage('image'), uploadProductImage);

module.exports = router;
