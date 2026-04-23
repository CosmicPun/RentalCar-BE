const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Provider = require('../models/Provider');

// @desc    Add provider to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addWishlistItem = async (req, res, next) => {
    try {
        const { providerId } = req.body;

        if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
            return res.status(400).json({
                success: false,
                message: 'providerId is required and must be a valid provider id'
            });
        }

        const provider = await Provider.findById(providerId);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: `Provider not found with id of ${providerId}`
            });
        }

        const existingWishlistItem = await Wishlist.findOne({
            userId: req.user.id,
            providerId
        });

        if (existingWishlistItem) {
            return res.status(409).json({
                success: false,
                message: 'Provider is already in your wishlist'
            });
        }

        const wishlistItem = await Wishlist.create({
            userId: req.user.id,
            providerId
        });

        res.status(201).json({
            success: true,
            data: wishlistItem
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Provider is already in your wishlist'
            });
        }

        next(err);
    }
};
