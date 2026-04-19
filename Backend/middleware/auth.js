const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware to verify the Supabase JWT token from the Authorization header.
 * - Validates the Bearer token against Supabase Auth.
 * - Fetches the user's profile from the `users` table.
 * - Attaches `req.user` (Supabase Auth user) and `req.profile` (DB profile with role).
 */
async function requireAuth(req, res, next) {
    try {
        // --- 1. Extract token ---
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Missing or invalid authorization header. Please login.'
            });
        }

        const token = authHeader.split(' ')[1];

        // --- 2. Verify token with Supabase Auth ---
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token. Please login again.'
            });
        }

        // --- 3. Fetch user profile from DB (includes role) ---
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id, email, name, role, phone, address, created_at')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile lookup failed:', profileError?.message);
            // User exists in Auth but not in the users table — create a basic profile
            const { data: newProfile } = await supabaseAdmin
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email.split('@')[0],
                    role: 'customer'
                })
                .select()
                .single();

            req.profile = newProfile || { id: user.id, email: user.email, role: 'customer' };
        } else {
            req.profile = profile;
        }

        // Attach Supabase Auth user object
        req.user = user;
        next();

    } catch (err) {
        console.error('Auth middleware error:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Authentication service unavailable.'
        });
    }
}

/**
 * Middleware to check if the authenticated user has the 'admin' role.
 * Checks the `role` column in the `users` database table (set via req.profile by requireAuth).
 * Must be used AFTER requireAuth middleware.
 */
async function requireAdmin(req, res, next) {
    try {
        // --- 1. Ensure user is authenticated ---
        if (!req.user || !req.profile) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required. Please login first.'
            });
        }

        // --- 2. Check role from the database profile ---
        if (req.profile.role !== 'admin') {
            console.warn(`Admin access denied for user: ${req.profile.email} (role: ${req.profile.role})`);
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.',
                user: req.profile.email
            });
        }

        // --- 3. User is admin — allow through ---
        console.log(`Admin access granted: ${req.profile.email}`);
        next();

    } catch (err) {
        console.error('Admin middleware error:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Authorization service unavailable.'
        });
    }
}

module.exports = { requireAuth, requireAdmin };
