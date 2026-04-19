const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ==========================================
// GET /api/users/profile
// Get the authenticated user's full profile
// ==========================================
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const { data: profile, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error || !profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found.'
            });
        }

        res.json({
            success: true,
            data: profile
        });

    } catch (err) {
        console.error('Get profile error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// PUT /api/users/profile
// Update the authenticated user's profile
// ==========================================
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (address) updates.address = address;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
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
            message: 'Profile updated successfully.',
            data
        });

    } catch (err) {
        console.error('Update profile error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// GET /api/users  (ADMIN ONLY)
// Get all users list
// ==========================================
router.get('/', requireAuth, requireAdmin, async (req, res) => {
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
        console.error('Get all users error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

// ==========================================
// DELETE /api/users/:id  (ADMIN ONLY)
// Delete a user by ID
// ==========================================
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Don't allow admin to delete themselves
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own admin account.'
            });
        }

        // Delete from users table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (dbError) {
            return res.status(400).json({
                success: false,
                error: dbError.message
            });
        }

        // Delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            console.error('Auth deletion error:', authError.message);
        }

        res.json({
            success: true,
            message: 'User deleted successfully.'
        });

    } catch (err) {
        console.error('Delete user error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

module.exports = router;
