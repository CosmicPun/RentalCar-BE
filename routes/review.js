const express = require('express');
const {
    addReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview
} = require('../controllers/review');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .post(protect, authorize('user', 'admin'), addReview)
    .get(getReviews);

router.route('/:reviewId')
    .get(protect, authorize('user', 'admin'), getReviewById)
    .put(protect, authorize('user', 'admin'), updateReview)
    .delete(protect, authorize('user', 'admin'), deleteReview);

module.exports = router;
