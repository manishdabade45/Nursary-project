const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(requireAuth);
router.use(requireAdmin);

// ==========================================
// GET /api/admin/stats
// Get dashboard statistics
// ==========================================
router.get('/stats', async (req, res) => {
    try {
        // Total orders
        const { count: totalOrders } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true });

        // Total sales
        const { data: salesData } = await supabaseAdmin
            .from('orders')
            .select('total');

        const totalSales = salesData
            ? salesData.reduce((sum, order) => sum + (order.total || 0), 0)
            : 0;

        // Total customers
        const { count: totalCustomers } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer');

        // Total plants sold
        const { data: itemsData } = await supabaseAdmin
            .from('order_items')
            .select('quantity');

        const totalPlantsSold = itemsData
            ? itemsData.reduce((sum, item) => sum + (item.quantity || 0), 0)
            : 0;

        // Orders by status
        const { data: confirmedOrders } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'confirmed');

        const { data: completedOrders } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        const { data: cancelledOrders } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'cancelled');

        res.json({
            success: true,
            data: {
                totalOrders: totalOrders || 0,
                totalSales,
                totalCustomers: totalCustomers || 0,
                totalPlantsSold,
                ordersByStatus: {
                    confirmed: confirmedOrders?.length || 0,
                    completed: completedOrders?.length || 0,
                    cancelled: cancelledOrders?.length || 0
                }
            }
        });

    } catch (err) {
        console.error('Admin stats error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// GET /api/admin/orders
// Get all orders (with items and user info)
// ==========================================
router.get('/orders', async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Optional status filter
        if (status) {
            query = query.eq('status', status);
        }

        const { data: orders, error } = await query;

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
        console.error('Admin get orders error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// PUT /api/admin/orders/:orderId/status
// Update order status (confirmed → completed / cancelled)
// ==========================================
router.put('/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['confirmed', 'processing', 'shipped', 'completed', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Order not found.'
            });
        }

        res.json({
            success: true,
            message: `Order ${orderId} updated to "${status}".`,
            data
        });

    } catch (err) {
        console.error('Update order status error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// GET /api/admin/users
// List all customers
// ==========================================
router.get('/users', async (req, res) => {
    try {
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id, email, name, role, phone, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (err) {
        console.error('Admin get users error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// DELETE /api/admin/orders/:orderId
// Delete an order
// ==========================================
router.delete('/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        // First get the order to find its internal id
        const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('order_id', orderId)
            .single();

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found.'
            });
        }

        // Delete order items first (FK constraint)
        await supabaseAdmin
            .from('order_items')
            .delete()
            .eq('order_id', order.id);

        // Delete the order
        const { error } = await supabaseAdmin
            .from('orders')
            .delete()
            .eq('id', order.id);

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: `Order ${orderId} deleted.`
        });

    } catch (err) {
        console.error('Delete order error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

module.exports = router;
