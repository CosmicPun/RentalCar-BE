const mongoose = require('mongoose');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Add review
// @route   POST /api/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
    try {
        const { bookingId, rating, comment } = req.body;
        
        if (!comment || comment.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'require your comment'
            });
        }

        // Check if booking exists
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${bookingId}`
            });
        }

        // Make sure user is booking owner or admin
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to add a review for this booking`
            });
        }

        // Add userId and providerId to req.body
        req.body.userId = req.user.id;
        req.body.providerId = booking.provider;

        // Check if review already exists for this booking
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: `Review already exists for booking ${bookingId}`
            });
        }

        const review = await Review.create(req.body);

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get reviews
// @route   GET /api/reviews (Personal reviews)
// @route   GET /api/reviews?all=true (All reviews - Admin only)
// @route   GET /api/cars/:carId/reviews (Car specific reviews)
// @access  Private for /api/reviews, Public for /api/cars/:carId/reviews
exports.getReviews = async (req, res, next) => {
    try {
        let query;
        if (req.params.carId) {
            if (!mongoose.Types.ObjectId.isValid(req.params.carId)) {
                return res.status(400).json({ success: false, message: 'Invalid car id' });
            }
            const bookings = await Booking.find({ car: req.params.carId }).select('_id');
            const bookingIds = bookings.map((booking) => booking._id);
            query = Review.find({ bookingId: { $in: bookingIds } });
        } else {
            if (req.query.all === 'true' || !req.user) {
                query = Review.find({});
            } else {
                query = Review.find({ userId: req.user.id });
            }
        }

        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Review.countDocuments(query.getFilter());

        query = query.skip(startIndex).limit(limit);

        // Population
        query = query.populate({
            path: 'bookingId',
            select: 'car',
            populate: { path: 'car', select: 'brand model licensePlate picture' }
        }).populate({
            path: 'providerId',
            select: 'name'
        }).populate({
            path: 'userId',
            select: 'name'
        });

        const reviews = await query;

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.status(200).json({
            success: true,
            total,
            count: reviews.length,
            pagination,
            data: reviews
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get review by id
// @route   GET /api/reviews/:reviewId
// @access  Private
exports.getReviewById = async (req, res, next) => {
    try {
        const { reviewId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review id'
            });
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: `No review with the id of ${reviewId}`
            });
        }

        if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to view this review`
            });
        }

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update review
// @route   PUT /api/reviews/:reviewId
// @access  Private
exports.updateReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const allowedFields = ['rating', 'comment'];
        const requestFields = Object.keys(req.body);
        const invalidFields = requestFields.filter((field) => !allowedFields.includes(field));

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review id'
            });
        }

        if (requestFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one field to update'
            });
        }

        if (invalidFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid fields in update request: ${invalidFields.join(', ')}`
            });
        }

        if (req.body.comment !== undefined && (req.body.comment === null || req.body.comment.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'require your comment'
            });
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: `No review with the id of ${reviewId}`
            });
        }

        if (review.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this review`
            });
        }

        allowedFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                review[field] = req.body[field];
            }
        });

        await review.save();

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (err) {
        if (err.name === 'ValidationError' || err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        next(err);
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
exports.deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review id'
            });
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: `No review with the id of ${reviewId}`
            });
        }

        if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this review`
            });
        }

        await Review.findByIdAndDelete(reviewId);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
