const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// ==========================================
// POST /api/auth/signup
// Register a new user with Supabase Auth
// ==========================================
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and name are required.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters.'
            });
        }

        // Create user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        // Insert profile into the users table
        if (data.user) {
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: data.user.email,
                    name: name,
                    role: 'customer'
                });

            if (profileError) {
                console.error('Profile creation error:', profileError.message);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            data: {
                user: {
                    id: data.user?.id,
                    email: data.user?.email,
                    name: name
                },
                session: data.session
            }
        });

    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error during signup.'
        });
    }
});

// ==========================================
// POST /api/auth/login
// Sign in an existing user
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required.'
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password.'
            });
        }

        // Fetch user profile from users table
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        res.json({
            success: true,
            message: 'Login successful!',
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    name: profile?.name || data.user.email.split('@')[0],
                    role: profile?.role || 'customer'
                },
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_at: data.session.expires_at
                }
            }
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error during login.'
        });
    }
});

// ==========================================
// POST /api/auth/logout
// Sign out the current user
// ==========================================
router.post('/logout', requireAuth, async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully.'
        });

    } catch (err) {
        console.error('Logout error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error during logout.'
        });
    }
});

// ==========================================
// GET /api/auth/me
// Get the currently authenticated user's profile
// ==========================================
router.get('/me', requireAuth, async (req, res) => {
    try {
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found.'
            });
        }

        res.json({
            success: true,
            data: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                created_at: profile.created_at
            }
        });

    } catch (err) {
        console.error('Get profile error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

module.exports = router;
