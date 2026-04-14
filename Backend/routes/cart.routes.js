const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// All cart routes require authentication
router.use(requireAuth);

// ==========================================
// GET /api/cart
// Get the current user's cart
// ==========================================
router.get('/', async (req, res) => {
    try {
        const { data: cartItems, error } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        // Calculate totals
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.json({
            success: true,
            data: {
                items: cartItems,
                totalItems,
                totalPrice
            }
        });

    } catch (err) {
        console.error('Get cart error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// POST /api/cart
// Add an item to the cart (or increment quantity if exists)
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { product_id, name, price, image, quantity = 1 } = req.body;

        if (!product_id || !name || !price) {
            return res.status(400).json({
                success: false,
                error: 'product_id, name, and price are required.'
            });
        }

        // Check if item already exists in cart
        const { data: existing } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('product_id', product_id)
            .single();

        let result;

        if (existing) {
            // Update quantity
            const { data, error } = await supabase
                .from('cart')
                .update({
                    quantity: existing.quantity + quantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Insert new cart item
            const { data, error } = await supabase
                .from('cart')
                .insert({
                    user_id: req.user.id,
                    product_id,
                    name,
                    price,
                    image: image || '',
                    quantity
                })
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        res.status(201).json({
            success: true,
            message: `${name} added to cart.`,
            data: result
        });

    } catch (err) {
        console.error('Add to cart error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// PUT /api/cart/:id
// Update quantity of a cart item
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid quantity is required.'
            });
        }

        // If quantity is 0, delete the item
        if (quantity === 0) {
            const { error } = await supabase
                .from('cart')
                .delete()
                .eq('id', id)
                .eq('user_id', req.user.id);

            if (error) throw error;

            return res.json({
                success: true,
                message: 'Item removed from cart.'
            });
        }

        const { data, error } = await supabase
            .from('cart')
            .update({
                quantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Cart updated.',
            data
        });

    } catch (err) {
        console.error('Update cart error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// DELETE /api/cart/:id
// Remove a single item from the cart
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('cart')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Item removed from cart.'
        });

    } catch (err) {
        console.error('Delete cart item error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// DELETE /api/cart
// Clear the entire cart for the current user
// ==========================================
router.delete('/', async (req, res) => {
    try {
        const { error } = await supabase
            .from('cart')
            .delete()
            .eq('user_id', req.user.id);

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Cart cleared.'
        });

    } catch (err) {
        console.error('Clear cart error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

module.exports = router;
