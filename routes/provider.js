const express = require('express');
const {
    getProviders,
    getProvider,
    createProvider,
    updateProvider,
    deleteProvider
} = require('../controllers/provider');

// Include other resource routers
const carRouter = require('./car');
const bookingRouter = require('./booking');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Providers
 *   description: Rental car provider management
 */

// Re-route into other resource routers (optional nested resources)
// router.use('/:providerId/cars', carRouter);
// router.use('/:providerId/bookings', bookingRouter);

/**
 * @swagger
 * /api/providers:
 *   get:
 *     summary: Get all providers
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: List of providers
 *   post:
 *     summary: Create a new provider
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - tel
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               tel:
 *                 type: string
 *     responses:
 *       201:
 *         description: Provider created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.route('/')
    .get(getProviders)
    .post(protect, authorize('admin'), createProvider);

/**
 * @swagger
 * /api/providers/{id}:
 *   get:
 *     summary: Get provider by ID
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *     responses:
 *       200:
 *         description: Provider details
 *       404:
 *         description: Provider not found
 *   put:
 *     summary: Update provider by ID
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Provider updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Provider not found
 *   delete:
 *     summary: Delete provider by ID
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *     responses:
 *       200:
 *         description: Provider deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Provider not found
 */
router.route('/:id')
    .get(getProvider)
    .put(protect, authorize('admin'), updateProvider)
    .delete(protect, authorize('admin'), deleteProvider);

module.exports = router;
