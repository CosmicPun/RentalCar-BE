const mongoose = require('mongoose');
const { addWishlist, getWishlists, deleteWishlist } = require('../controllers/wishlist');
const Wishlist = require('../models/Wishlist');
const Car = require('../models/Car');
const Provider = require('../models/Provider');
const User = require('../models/User');

require('./setup');

describe('Wishlist Controller (Integration)', () => {
    let req, res, next;
    let user, admin, provider, car;

    beforeEach(async () => {
        req = { body: {}, params: {}, query: {}, user: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        next = jest.fn();

        const suffix = Math.random().toString(36).substring(2, 7);
        user = await User.create({ name: 'U', email: `u${suffix}@t.com`, password: 'password123', telephone: '0812345678', role: 'user' });
        admin = await User.create({ name: 'A', email: `a${suffix}@t.com`, password: 'password123', telephone: '0811111111', role: 'admin' });
        provider = await Provider.create({ name: `P${suffix}`, address: 'A', district: 'D', province: 'P', postalcode: '12345', tel: '021234567', region: 'R' });
        car = await Car.create({ brand: 'Toyota', model: 'Vios', licensePlate: `LP-${suffix}`, year: 2020, color: 'W', transmission: 'Automatic', rentPrice: 10, provider: provider._id });
    });

    describe('addWishlist', () => {
        it('should handle all add success and failure cases', async () => {
            req.user = user;
            
            // Invalid carId
            req.body = { carId: 'invalid' };
            await addWishlist(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            // Car not found
            req.body = { carId: new mongoose.Types.ObjectId().toString() };
            await addWishlist(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);

            // Success
            req.body = { carId: car._id.toString() };
            await addWishlist(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);

            // Manual duplicate check
            await addWishlist(req, res, next);
            expect(res.status).toHaveBeenCalledWith(409);
        });

        it('should handle MongoDB duplicate key error (11000)', async () => {
            req.user = user;
            req.body = { carId: car._id.toString() };
            
            const error = new Error('Duplicate');
            error.code = 11000;
            const spy = jest.spyOn(Wishlist, 'create').mockRejectedValueOnce(error);
            
            await addWishlist(req, res, next);
            expect(res.status).toHaveBeenCalledWith(409);
            spy.mockRestore();
        });

        it('should handle other catch block errors', async () => {
            const spy = jest.spyOn(Wishlist, 'findById').mockRejectedValueOnce(new Error());
            req.user = user;
            req.body = { carId: 'invalid' }; // Trigger invalid ID check instead of DB
            await addWishlist(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);

            jest.spyOn(Wishlist, 'create').mockRejectedValueOnce(new Error('Other'));
            req.body = { carId: car._id.toString() };
            await addWishlist(req, res, next);
            expect(next).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('getWishlists', () => {
        it('should handle default pagination and next pagination link', async () => {
            // Create 5 wishlist items and use a small limit to trigger next link
            for(let i=0; i<5; i++) {
                const c = await Car.create({ brand: 'B'+i, model: 'M', licensePlate: `LX${i}-${Math.random().toString(36).substring(2,5)}`, year: 2020, color: 'W', transmission: 'Automatic', rentPrice: 10, provider: provider._id });
                await Wishlist.create({ userId: user._id, carId: c._id });
            }

            req.user = user;
            req.query = { limit: '2' }; // Small limit to guarantee next link
            await getWishlists(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                pagination: expect.objectContaining({ next: expect.any(Object) })
            }));
        });

        it('should handle default pagination values and no next link', async () => {
            // Create only 1 item
            const c = await Car.create({ brand: 'Solo', model: 'S', licensePlate: `Solo-${Math.random().toString(36).substring(2,5)}`, year: 2020, color: 'W', transmission: 'Automatic', rentPrice: 10, provider: provider._id });
            await Wishlist.create({ userId: user._id, carId: c._id });

            req.user = user;
            req.query = {}; // Hits default page=1, limit=25. endIndex=25, total=1. 25 < 1 is false.
            await getWishlists(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
            const callData = res.json.mock.calls[res.json.mock.calls.length - 1][0];
            expect(callData.pagination.next).toBeUndefined();
        });

        it('should handle admin view and pagination links', async () => {
            // Create 3 wishlist items
            for(let i=0; i<3; i++) {
                const c = await Car.create({ brand: 'B'+i, model: 'M', licensePlate: `L${i}-${Math.random().toString(36).substring(2,5)}`, year: 2020, color: 'W', transmission: 'Automatic', rentPrice: 10, provider: provider._id });
                await Wishlist.create({ userId: user._id, carId: c._id });
            }

            // Admin view (hits car.wishlistedBy)
            req.user = admin;
            req.query = { page: '1', limit: '1' };
            await getWishlists(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                pagination: expect.objectContaining({ next: expect.any(Object) })
            }));

            // User view + Prev link
            req.user = user;
            req.query = { page: '2', limit: '1', sort: 'createdAt', select: 'carId' };
            await getWishlists(req, res, next);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                pagination: expect.objectContaining({ prev: expect.any(Object) })
            }));
        });

        it('should handle query operators (gt, etc.) and handle ghost cars', async () => {
            // Test query operators replacement (line 77)
            req.user = user;
            req.query = { 'rentPrice[gt]': '5' };
            await getWishlists(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);

            // Test filter for ghost cars (line 122)
            const c2 = await Car.create({ brand: 'Ghost', model: 'G', licensePlate: 'GHOST-1', year: 2020, color: 'W', transmission: 'Automatic', rentPrice: 10, provider: provider._id });
            await Wishlist.create({ userId: user._id, carId: c2._id });
            
            // Delete the car but keep the wishlist item
            await Car.findByIdAndDelete(c2._id);
            
            await getWishlists(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle catch block', async () => {
            const spy = jest.spyOn(Wishlist, 'find').mockImplementationOnce(() => { throw new Error(); });
            req.user = user;
            await getWishlists(req, res, next);
            expect(next).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('deleteWishlist', () => {
        it('should handle all delete failure cases and success', async () => {
            const w = await Wishlist.create({ userId: user._id, carId: car._id });
            
            // Unauthorized
            req.user = await User.create({ name: 'O', email: `o${Math.random()}@t.com`, password: 'password123', telephone: '0811111112' });
            req.params.id = w._id.toString();
            await deleteWishlist(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);

            // Not found
            req.user = user;
            req.params.id = new mongoose.Types.ObjectId().toString();
            await deleteWishlist(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);

            // Success (Owner)
            req.params.id = w._id.toString();
            await deleteWishlist(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle admin delete', async () => {
            const w = await Wishlist.create({ userId: user._id, carId: car._id });
            req.user = admin;
            req.params.id = w._id.toString();
            await deleteWishlist(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle catch block', async () => {
            req.user = user;
            req.params.id = 'invalid';
            await deleteWishlist(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
