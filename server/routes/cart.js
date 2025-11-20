const express = require('express');
const router = express.Router();

// Simple test route
router.get('/', (req, res) => {
    console.log('🛒 Cart route hit!');
    res.json({ 
        success: true, 
        message: 'Cart API is working!',
        cart: { items: [] }
    });
});

router.post('/add', (req, res) => {
    console.log('🛒 Add to cart:', req.body);
    res.json({ 
        success: true, 
        message: 'Item added to cart (test mode)'
    });
});

router.put('/update', (req, res) => {
    console.log('🛒 Update cart:', req.body);
    res.json({ 
        success: true, 
        message: 'Cart updated (test mode)'
    });
});

router.delete('/remove/:productId', (req, res) => {
    console.log('🛒 Remove from cart:', req.params);
    res.json({ 
        success: true, 
        message: 'Item removed (test mode)'
    });
});

router.delete('/clear', (req, res) => {
    console.log('🛒 Clear cart');
    res.json({ 
        success: true, 
        message: 'Cart cleared (test mode)'
    });
});

router.post('/checkout', (req, res) => {
    console.log('🛒 Checkout:', req.body);
    res.json({ 
        success: true, 
        message: 'Checkout successful (test mode)'
    });
});

module.exports = router;