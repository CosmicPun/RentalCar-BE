const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Provider = require('../models/Provider');

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
    let query;

    // General users can only see their own bookings
    if (req.user.role !== 'admin') {
        query = Booking.find({ user: req.user.id }).populate({
            path: 'car',
            select: 'licensePlate brand model',
            populate: {
                path: 'provider',
                select: 'name address tel'
            }
        });
    } else {
        // Admins can see all bookings
        if (req.params.carId) {
            query = Booking.find({ car: req.params.carId }).populate({
                path: 'car',
                select: 'licensePlate brand model',
                populate: {
                    path: 'provider',
                    select: 'name address tel'
                }
            });
        } else if (req.params.providerId) {
            query = Booking.find({ provider: req.params.providerId }).populate({
                path: 'car',
                select: 'licensePlate brand model',
                populate: {
                    path: 'provider',
                    select: 'name address tel'
                }
            });
        } else {
            query = Booking.find().populate({
                path: 'car',
                select: 'licensePlate brand model',
                populate: {
                    path: 'provider',
                    select: 'name address tel'
                }
            }).populate('user', 'name email');
        }
    }

    try {
        const bookings = await query;
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'car',
            select: 'licensePlate brand model',
            populate: {
                path: 'provider',
                select: 'name address tel'
            }
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.id}`
            });
        }

        // Make sure user is booking owner or admin
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to view this booking`
            });
        }

        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        next(err);
    }
};

// @desc    Add booking
// @route   POST /api/v1/cars/:carId/bookings/
// @access  Private
exports.addBooking = async (req, res, next) => {
    try {
        req.body.car = req.params.carId;

        // Find car and its provider
        const car = await Car.findById(req.params.carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: `No car with the id of ${req.params.carId}`
            });
        }

        // Check car availability
        if (!car.available) {
            return res.status(400).json({
                success: false,
                message: `Car with ID ${req.params.carId} is not available`
            });
        }

        // Add provider from car to booking body
        req.body.provider = car.provider;

        // Add user to req.body
        req.body.user = req.user.id;

        // Check for existing bookings
        const existedBookings = await Booking.find({ user: req.user.id });

        // If the user is not an admin, they can only create 3 bookings
        if (existedBookings.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already 3 bookings`
            });
        }

        // Calculate total cost
        const date1 = new Date(req.body.bookingDate);
        const date2 = new Date(req.body.returnDate);

        // Validation: returnDate must be after bookingDate
        if (date2 <= date1) {
            return res.status(400).json({
                success: false,
                message: 'Return date must be after booking date'
            });
        }

        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        req.body.totalCost = diffDays * car.rentPrice;

        const booking = await Booking.create(req.body);

        // Update car availability to false
        car.available = false;
        await car.save();

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.id}`
            });
        }

        // Make sure user is booking owner or admin
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this booking`
            });
        }

        // If car is changed, update availability
        if (req.body.car && req.body.car !== booking.car.toString()) {
            const newCar = await Car.findById(req.body.car);
            if (!newCar || !newCar.available) {
                return res.status(400).json({
                    success: false,
                    message: `Requested car is not available`
                });
            }
            // Mark old car as available
            await Car.findByIdAndUpdate(booking.car, { available: true });
            // Mark new car as unavailable
            newCar.available = false;
            await newCar.save();
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.id}`
            });
        }

        // Make sure user is booking owner or admin
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this booking`
            });
        }

        // Mark car as available
        await Car.findByIdAndUpdate(booking.car, { available: true });

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
