const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// All order routes require authentication
router.use(requireAuth);

// ==========================================
// POST /api/orders
// Place a new order (checkout)
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { items, shipping, total } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Order must contain at least one item.'
            });
        }

        if (!shipping || !shipping.name || !shipping.address) {
            return res.status(400).json({
                success: false,
                error: 'Shipping details are required.'
            });
        }

        // Generate order ID
        const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // Create the order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                order_id: orderId,
                user_id: req.user.id,
                user_email: req.user.email,
                total: total || items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                status: 'confirmed',
                shipping_details: shipping
            })
            .select()
            .single();

        if (orderError) {
            return res.status(400).json({
                success: false,
                error: orderError.message
            });
        }

        // Insert order items
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.product_id || item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image || ''
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items insert error:', itemsError.message);
        }

        // Clear the user's cart after successful order
        await supabaseAdmin
            .from('cart')
            .delete()
            .eq('user_id', req.user.id);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            data: {
                orderId: orderId,
                total: order.total,
                status: order.status,
                date: order.created_at
            }
        });

    } catch (err) {
        console.error('Place order error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// GET /api/orders
// Get the authenticated user's order history
// ==========================================
router.get('/', async (req, res) => {
    try {
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (err) {
        console.error('Get orders error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// GET /api/orders/:orderId
// Get a specific order's details
// ==========================================
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .eq('order_id', orderId)
            .eq('user_id', req.user.id)
            .single();

        if (error || !order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found.'
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (err) {
        console.error('Get order error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

module.exports = router;
