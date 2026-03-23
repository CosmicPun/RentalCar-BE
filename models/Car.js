const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    licensePlate: {
        type: String,
        required: [true, 'Please add a license plate'],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [15, 'License plate cannot be more than 15 characters']
    },
    brand: {
        type: String,
        required: [true, 'Please add a brand (e.g., Toyota, Tesla)'],
        trim: true
    },
    model: {
        type: String,
        required: [true, 'Please add a model (e.g., Camry, Model 3)'],
        trim: true
    },
    year: {
        type: Number,
        required: [true, 'Please add the manufacturing year'],
        min: [1980, 'Year must be 1980 or later'],
        max: [new Date().getFullYear() + 1, 'Year cannot be in the far future']
    },
    color: {
        type: String,
        required: [true, 'Please add the car color'],
        trim: true,
        maxlength: [30, 'Color cannot be more than 30 characters']
    },
    transmission: {
        type: String,
        enum: ['Automatic', 'Manual'],
        required: [true, 'Please specify the transmission type']
    },
    fuelType: {
        type: String,
        enum: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
        default: 'Gasoline'
    },
    available: {
        type: Boolean,
        default: true
    },
    provider: {
        type: mongoose.Schema.ObjectId,
        ref: 'Provider',
        required: true,
    },
    picture: {
        type: String,
        default: 'https://drive.google.com/uc?id=1Sw17oditCfc1Nz3-k5WNi0w-GAtzQrsw'
    },
    rentPrice: {
        type: Number,
        required: [true, 'Please add a rental price per day']
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
});

module.exports = mongoose.model('Car', carSchema);
