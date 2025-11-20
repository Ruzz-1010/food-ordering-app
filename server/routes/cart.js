const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// Get user's cart
router.get('/', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
            await cart.save();
        }
        
        res.json({ success: true, cart });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
    try {
        const { productId, restaurantId, quantity = 1 } = req.body;

        let cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            cart = new Cart({ 
                user: req.user.id, 
                items: [],
                restaurant: restaurantId
            });
        }

        // Check if adding from different restaurant
        if (cart.restaurant && cart.restaurant.toString() !== restaurantId && cart.items.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Your cart contains items from another restaurant. Clear cart first to order from this restaurant.`,
                needsClear: true
            });
        }

        // Set restaurant if first item
        if (cart.items.length === 0) {
            cart.restaurant = restaurantId;
        }

        // Check if item already exists
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                quantity: quantity,
                addedAt: new Date()
            });
        }

        await cart.save();
        await cart.populate('items.product');
        
        res.json({
            success: true,
            message: 'Item added to cart',
            cart
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update cart item quantity
router.put('/update', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        if (quantity <= 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = quantity;
        }

        // If cart is empty, remove restaurant reference
        if (cart.items.length === 0) {
            cart.restaurant = null;
        }

        await cart.save();
        await cart.populate('items.product');
        
        res.json({
            success: true,
            message: 'Cart updated',
            cart
        });

    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Remove item from cart
router.delete('/remove/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );

        // If cart is empty, remove restaurant reference
        if (cart.items.length === 0) {
            cart.restaurant = null;
        }

        await cart.save();
        await cart.populate('items.product');
        
        res.json({
            success: true,
            message: 'Item removed from cart',
            cart
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = [];
        cart.restaurant = null;
        await cart.save();
        
        res.json({
            success: true,
            message: 'Cart cleared',
            cart
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Checkout - Create order from cart
router.post('/checkout', auth, async (req, res) => {
    try {
        const { deliveryAddress, paymentMethod, specialInstructions } = req.body;

        const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Calculate totals
        const subtotal = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        const deliveryFee = subtotal > 299 ? 0 : 35;
        const serviceFee = Math.max(10, subtotal * 0.02);
        const total = subtotal + deliveryFee + serviceFee;

        // Create order
        const order = new Order({
            user: req.user.id,
            restaurant: cart.restaurant,
            items: cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price
            })),
            subtotal,
            deliveryFee,
            serviceFee,
            total,
            deliveryAddress,
            paymentMethod,
            specialInstructions,
            status: 'pending'
        });

        await order.save();

        // Clear cart after successful order
        cart.items = [];
        cart.restaurant = null;
        await cart.save();

        res.json({
            success: true,
            message: 'Order placed successfully',
            order
        });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;