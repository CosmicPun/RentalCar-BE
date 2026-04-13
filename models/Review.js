const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
       comment: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Review", reviewSchema);