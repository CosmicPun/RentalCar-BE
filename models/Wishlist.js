const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

wishlistSchema.index({ userId: 1, providerId: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
