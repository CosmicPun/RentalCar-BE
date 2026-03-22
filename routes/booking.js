const express = require('express');
const {
    getBookings,
    getBooking,
    addBooking,
    updateBooking,
    deleteBooking
} = require('../controllers/booking');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Car booking operations
 */

/**
 * @swagger
 * /api/cars/{carId}/bookings:
 *   get:
 *     summary: Get bookings (optionally by car)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: false
 *         schema:
 *           type: string
 *         description: Car ID (when nested under /cars)
 *     responses:
 *       200:
 *         description: List of bookings
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new booking for a car
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation or business rule error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.route('/')
    .get(protect, getBookings)
    .post(protect, authorize('user', 'admin'), addBooking);

/**
 * @swagger
 * /api/cars/{carId}/bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: false
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *   put:
 *     summary: Update a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: false
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *   delete:
 *     summary: Delete a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: false
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 */
router.route('/:id')
    .get(protect, getBooking)
    .put(protect, authorize('user', 'admin'), updateBooking)
    .delete(protect, authorize('user', 'admin'), deleteBooking);

module.exports = router;
