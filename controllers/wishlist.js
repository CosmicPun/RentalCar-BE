const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Car = require('../models/Car');

// @desc    Add car to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addWishlist = async (req, res, next) => {
    try {
        const { carId } = req.body;

        if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
            return res.status(400).json({
                success: false,
                message: 'carId is required and must be a valid car id'
            });
        }

        const car = await Car.findById(carId);

        if (!car) {
            return res.status(404).json({
                success: false,
                message: `Car not found with id of ${carId}`
            });
        }

        const existingWishlistItem = await Wishlist.findOne({
            userId: req.user.id,
            carId
        });

        if (existingWishlistItem) {
            return res.status(409).json({
                success: false,
                message: 'Car is already in your wishlist'
            });
        }

        const wishlistItem = await Wishlist.create({
            userId: req.user.id,
            carId
        });

        res.status(201).json({
            success: true,
            data: wishlistItem
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Car is already in your wishlist'
            });
        }

        next(err);
    }
};

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlists = async (req, res, next) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude from filtering
        const removeFields = ['select', 'sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);

        // Create query string with MongoDB operators ($gt, $gte, etc.)
        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        let filters = JSON.parse(queryStr);

        // If user is not admin, they can only see their own wishlist
        if (req.user.role !== 'admin') {
            filters.userId = req.user.id;
        }

        // Finding resource
        query = Wishlist.find(filters).populate({
            path: 'carId',
            populate: {
                path: 'provider',
                select: 'name address tel'
            }
        });

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
        const total = await Wishlist.countDocuments(filters);

        query = query.skip(startIndex).limit(limit);

        const wishlistItems = await query;

        // Extract the cars and add the wishlist item ID to each car object
        const wishlistedCars = wishlistItems
            .filter(item => item.carId) // Ensure car still exists
            .map(item => {
                const car = item.carId.toObject();
                car.wishlistItemId = item._id;
                // If admin, show who wishlisted it
                if (req.user.role === 'admin') {
                    car.wishlistedBy = item.userId;
                }
                return car;
            });

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
            count: wishlistedCars.length,
            total,
            pagination,
            data: wishlistedCars
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete wishlist item
// @route   DELETE /api/wishlist/:id
// @access  Private
exports.deleteWishlist = async (req, res, next) => {
    try {
        const wishlistItem = await Wishlist.findById(req.params.id);

        if (!wishlistItem) {
            return res.status(404).json({
                success: false,
                message: `No wishlist item with the id of ${req.params.id}`
            });
        }

        // Make sure user is wishlist item owner or admin
        if (wishlistItem.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this wishlist item`
            });
        }

        await wishlistItem.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
