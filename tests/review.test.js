const mongoose = require('mongoose');
const { addReview, getReviews, getReviewById, updateReview, deleteReview } = require('../controllers/review');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Provider = require('../models/Provider');
const User = require('../models/User');

require('./setup');

describe('Review Controller (Integration)', () => {
    let req, res, next;
    let user, admin, provider, car, booking;

    beforeEach(async () => {
        req = { body: {}, params: {}, query: {}, user: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        next = jest.fn();

        const suffix = Math.random().toString(36).substring(2, 7);
        user = await User.create({ name: 'U', email: `u${suffix}@t.com`, password: 'password123', telephone: '0812345678', role: 'user' });
        admin = await User.create({ name: 'A', email: `a${suffix}@t.com`, password: 'password123', telephone: '0811111111', role: 'admin' });
        provider = await Provider.create({ name: `P${suffix}`, address: 'A', district: 'D', province: 'P', postalcode: '12345', tel: '021234567', region: 'R' });
        car = await Car.create({ brand: 'B', model: 'M', licensePlate: `LP-${suffix}`, year: 2022, color: 'B', transmission: 'Automatic', rentPrice: 100, provider: provider._id });
        booking = await Booking.create({ bookingDate: '2026-05-01', returnDate: '2026-05-03', user: user._id, car: car._id, provider: provider._id, totalCost: 200 });
        booking.status = 'complete';
        await booking.save();
    });

    describe('addReview', () => {
        it('should add review successfully', async () => {
            req.user = user;
            req.body = { bookingId: booking._id.toString(), rating: 5, comment: 'Good' };
            await addReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 for empty comment', async () => {
            req.user = user;
            req.body = { comment: ' ' };
            await addReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 for missing booking', async () => {
            req.user = user;
            req.body = { bookingId: new mongoose.Types.ObjectId().toString(), comment: 't', rating: 5 };
            await addReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 401 for non-owner', async () => {
            const other = await User.create({ name: 'O', email: `o${Math.random()}@t.com`, password: 'password123', telephone: '0811111112' });
            req.user = other;
            req.body = { bookingId: booking._id.toString(), rating: 5, comment: 't' };
            await addReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 for duplicate review', async () => {
            await Review.create({ bookingId: booking._id, userId: user._id, providerId: provider._id, rating: 5, comment: 't' });
            req.user = user;
            req.body = { bookingId: booking._id.toString(), rating: 5, comment: 't' };
            await addReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 for incomplete booking', async () => {
            const pendingBooking = await Booking.create({ bookingDate: '2026-05-01', returnDate: '2026-05-03', user: user._id, car: car._id, provider: provider._id, totalCost: 200, status: 'pending' });
            req.user = user;
            req.body = { bookingId: pendingBooking._id.toString(), rating: 5, comment: 'Good' };
            await addReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle catch block error', async () => {
            const spy = jest.spyOn(Review, 'create').mockRejectedValueOnce(new Error('DB Error'));
            req.user = user;
            req.body = { bookingId: booking._id.toString(), rating: 5, comment: 't' };
            await addReview(req, res, next);
            expect(next).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('getReviews', () => {
        it('should handle carId query and invalid carId', async () => {
            req.params.carId = 'invalid';
            await getReviews(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            req.params.carId = car._id.toString();
            await getReviews(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle query all/guest and default sort', async () => {
            req.query = { all: 'true' };
            await getReviews(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);

            req.user = null;
            req.query = {};
            await getReviews(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle user specific reviews', async () => {
            req.user = user;
            await getReviews(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle select and sort query', async () => {
            req.query = { select: 'comment', sort: 'rating' };
            await getReviews(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle pagination next and prev links', async () => {
            for(let i=0; i<3; i++) {
                const b = await Booking.create({ bookingDate: '2026-01-01', returnDate: '2026-01-02', user: user._id, car: car._id, provider: provider._id, totalCost: 10 });
                await Review.create({ bookingId: b._id, userId: user._id, providerId: provider._id, rating: 5, comment: 't' });
            }
            req.query = { all: 'true', page: '1', limit: '1' };
            await getReviews(req, res, next);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pagination: expect.objectContaining({ next: expect.any(Object) }) }));

            req.query = { all: 'true', page: '2', limit: '1' };
            await getReviews(req, res, next);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pagination: expect.objectContaining({ prev: expect.any(Object) }) }));
        });

        it('should handle catch block error', async () => {
            const spy = jest.spyOn(Review, 'countDocuments').mockRejectedValueOnce(new Error());
            await getReviews(req, res, next);
            expect(next).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('getReviewById', () => {
        it('should handle all retrieval cases', async () => {
            req.params.reviewId = 'invalid';
            await getReviewById(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            req.params.reviewId = new mongoose.Types.ObjectId().toString();
            await getReviewById(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);

            const r = await Review.create({ bookingId: booking._id, userId: user._id, providerId: provider._id, rating: 5, comment: 't' });
            req.params.reviewId = r._id.toString();
            
            // Unauthorized
            req.user = await User.create({ name: 'O', email: `o${Math.random()}@t.com`, password: 'password123', telephone: '0811111112' });
            await getReviewById(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);

            // Admin Success
            req.user = admin;
            await getReviewById(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle catch block error', async () => {
            const spy = jest.spyOn(Review, 'findById').mockRejectedValueOnce(new Error());
            req.params.reviewId = new mongoose.Types.ObjectId().toString();
            await getReviewById(req, res, next);
            expect(next).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('updateReview', () => {
        it('should handle all update failure cases', async () => {
            req.params.reviewId = 'invalid';
            await updateReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            req.params.reviewId = new mongoose.Types.ObjectId().toString();
            req.body = {};
            await updateReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            req.body = { invalid: 1 };
            await updateReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            const r = await Review.create({ bookingId: booking._id, userId: user._id, providerId: provider._id, rating: 5, comment: 't' });
            req.params.reviewId = r._id.toString();
            req.user = user;
            req.body = { comment: '' };
            await updateReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            req.params.reviewId = new mongoose.Types.ObjectId().toString();
            req.body = { comment: 'v' };
            await updateReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);

            req.params.reviewId = r._id.toString();
            req.user = await User.create({ name: 'O', email: `o${Math.random()}@t.com`, password: 'password123', telephone: '0811111112' });
            await updateReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should update successfully with partial fields', async () => {
            const r = await Review.create({ bookingId: booking._id, userId: user._id, providerId: provider._id, rating: 5, comment: 't' });
            req.params.reviewId = r._id.toString();
            req.user = user;
            req.body = { rating: 2 }; // Only one field to hit the else branch in the allowedFields loop
            await updateReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should update successfully', async () => {
            const r = await Review.create({ bookingId: booking._id, userId: user._id, providerId: provider._id, rating: 5, comment: 't' });
            req.params.reviewId = r._id.toString();
            req.user = user;
            req.body = { rating: 1, comment: 'v' };
            await updateReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle ValidationError/CastError and next(err)', async () => {
            const r = await Review.create({ bookingId: booking._id, userId: user._id, providerId: provider._id, rating: 5, comment: 't' });
            req.params.reviewId = r._id.toString();
            req.user = user;
            req.body = { rating: 1 };
            
            const ve = new Error('V'); ve.name = 'ValidationError';
            jest.spyOn(Review, 'findById').mockRejectedValueOnce(ve);
            await updateReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            const ce = new Error('C'); ce.name = 'CastError';
            jest.spyOn(Review, 'findById').mockRejectedValueOnce(ce);
            await updateReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            jest.spyOn(Review, 'findById').mockRejectedValueOnce(new Error());
            await updateReview(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('deleteReview', () => {
        it('should handle all delete failure cases', async () => {
            req.params.reviewId = 'invalid';
            await deleteReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            req.params.reviewId = new mongoose.Types.ObjectId().toString();
            await deleteReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);

            const r = await Review.create({ bookingId: booking._id, userId: user._id, providerId: provider._id, rating: 5, comment: 't' });
            req.params.reviewId = r._id.toString();
            req.user = await User.create({ name: 'O', email: `o${Math.random()}@t.com`, password: 'password123', telephone: '0811111112' });
            await deleteReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should delete successfully and handle catch block', async () => {
            const r = await Review.create({ bookingId: booking._id, userId: user._id, providerId: provider._id, rating: 5, comment: 't' });
            req.params.reviewId = r._id.toString();
            req.user = admin;
            await deleteReview(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);

            jest.spyOn(Review, 'findById').mockRejectedValueOnce(new Error());
            await deleteReview(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
