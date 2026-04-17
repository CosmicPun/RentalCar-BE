const express = require('express');
const {
    addReview,
    updateReview
} = require('../controllers/review');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .post(protect, authorize('user', 'admin'), addReview);

router.route('/:reviewId')
    .put(protect, authorize('user', 'admin'), updateReview);

module.exports = router;
