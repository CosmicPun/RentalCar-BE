const express = require('express');
const {
    getCars,
    getCar,
    createCar,
    updateCar,
    deleteCar
} = require('../controllers/car');

// Include other resource routers
const bookingRouter = require('./booking');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Cars
 *   description: Car catalog management
 */

// Re-route into other resource routers
router.use('/:carId/bookings', bookingRouter);

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: Get all cars
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of cars
 *   post:
 *     summary: Create a new car
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - licensePlate
 *               - brand
 *               - model
 *               - year
 *               - color
 *               - transmission
 *               - provider
 *             properties:
 *               licensePlate:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               color:
 *                 type: string
 *               transmission:
 *                 type: string
 *                 enum: [Automatic, Manual]
 *               fuelType:
 *                 type: string
 *                 enum: [Gasoline, Diesel, Electric, Hybrid]
 *               provider:
 *                 type: string
 *                 description: Provider ID
 *     responses:
 *       201:
 *         description: Car created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.route('/')
    .get(getCars)
    .post(protect, authorize('admin'), createCar);

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     summary: Get car by ID
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car details
 *       404:
 *         description: Car not found
 *   put:
 *     summary: Update car by ID
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       200:
 *         description: Car updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Car not found
 *   delete:
 *     summary: Delete car by ID
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Car not found
 */
router.route('/:id')
    .get(getCar)
    .put(protect, authorize('admin'), updateCar)
    .delete(protect, authorize('admin'), deleteCar);

module.exports = router;
