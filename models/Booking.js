const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingDate: {
        type: Date,
        required: [true, 'Please add a booking date']
    },
    returnDate: {
        type: Date,
        required: [true, 'Please add a return date']
    },
    totalCost: {
        type: Number,
        default: 0
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    car: {
        type: mongoose.Schema.ObjectId,
        ref: 'Car',
        required: true
    },
    provider: {
        type: mongoose.Schema.ObjectId,
        ref: 'Provider',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', BookingSchema);
