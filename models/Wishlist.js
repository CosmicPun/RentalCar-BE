const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        carId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Car",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

wishlistSchema.index({ userId: 1, carId: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
