const express = require('express');
const { getWishlists, addWishlist, deleteWishlist } = require('../controllers/wishlist');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: User car wishlist management
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get current user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wishlisted cars
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, authorize('user', 'admin'), getWishlists);

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Add a car to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - carId
 *             properties:
 *               carId:
 *                 type: string
 *                 description: ID of the car to add to wishlist
 *     responses:
 *       201:
 *         description: Car added to wishlist
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Car not found
 *       409:
 *         description: Car already in wishlist
 */
router.post('/', protect, authorize('user', 'admin'), addWishlist);

/**
 * @swagger
 * /api/wishlist/{id}:
 *   delete:
 *     summary: Remove a car from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist item ID
 *     responses:
 *       200:
 *         description: Car removed from wishlist
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wishlist item not found
 */
router.delete('/:id', protect, authorize('user', 'admin'), deleteWishlist);

module.exports = router;
