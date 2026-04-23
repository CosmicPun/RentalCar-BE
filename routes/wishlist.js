const express = require('express');
const { addWishlistItem } = require('../controllers/wishlist');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('user', 'admin'), addWishlistItem);

module.exports = router;
