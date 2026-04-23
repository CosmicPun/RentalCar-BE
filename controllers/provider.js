const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Wishlist = require('../models/Wishlist');

const attachWishlistedStatus = async (providers, userId) => {
    const providerObjects = providers.map(provider => provider.toObject({ virtuals: true }));

    if (!userId || providerObjects.length === 0) {
        return providerObjects.map(provider => ({
            ...provider,
            wishlisted: false
        }));
    }

    const providerIds = providerObjects.map(provider => provider._id);
    const wishlistItems = await Wishlist.find({
        userId,
        providerId: { $in: providerIds }
    }).select('providerId -_id');

    const wishlistedProviderIds = new Set(
        wishlistItems.map(item => item.providerId.toString())
    );

    return providerObjects.map(provider => ({
        ...provider,
        wishlisted: wishlistedProviderIds.has(provider._id.toString())
    }));
};

// @desc    Get all providers
// @route   GET /api/v1/providers
// @access  Public
exports.getProviders = async (req, res, next) => {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string with MongoDB operators ($gt, $gte, etc.)
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    const filters = JSON.parse(queryStr);

    // Finding resource & Populate cars (from Virtual)
    query = Provider.find(filters).populate('cars');

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
    const total = await Provider.countDocuments(filters);

    query = query.skip(startIndex).limit(limit);

    try {
        const providers = await query;
        const providersWithWishlist = await attachWishlistedStatus(
            providers,
            req.user && req.user._id
        );

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
            count: providersWithWishlist.length,
            pagination,
            data: providersWithWishlist
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single provider
// @route   GET /api/v1/providers/:id
// @access  Public
exports.getProvider = async (req, res, next) => {
    try {
        // Populate 'cars' using the virtual field defined in Model
        const provider = await Provider.findById(req.params.id).populate('cars');

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: `Provider not found with id of ${req.params.id}`
            });
        }

        res.status(200).json({ success: true, data: provider });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new provider
// @route   POST /api/v1/providers
// @access  Private (Admin)
exports.createProvider = async (req, res, next) => {
    try {
        const provider = await Provider.create(req.body);
        res.status(201).json({ success: true, data: provider });
    } catch (err) {
        next(err);
    }
};

// @desc    Update provider
// @route   PUT /api/v1/providers/:id
// @access  Private (Admin)
exports.updateProvider = async (req, res, next) => {
    try {
        const provider = await Provider.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: `Provider not found with id of ${req.params.id}`
            });
        }

        res.status(200).json({ success: true, data: provider });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete provider and its bookings
// @route   DELETE /api/v1/providers/:id
// @access  Private (Admin)
exports.deleteProvider = async (req, res, next) => {
    try {
        const provider = await Provider.findById(req.params.id);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: `Provider not found with id of ${req.params.id}`
            });
        }

        // Cascade delete: ลบการจอง (Bookings) และ รถ (Cars) ทั้งหมดที่เกี่ยวข้องกับบริษัทรถเช่านี้
        await Car.deleteMany({ provider: req.params.id });
        await Booking.deleteMany({ provider: req.params.id });

        // ลบผู้ให้บริการ
        await provider.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
