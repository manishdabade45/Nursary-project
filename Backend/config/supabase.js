const { createClient } = require('@supabase/supabase-js');

// Admin client (uses service role key — bypasses RLS, for admin operations only)
// This is safe to share because the service role key is stateless w.r.t. user sessions.
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create a per-request Supabase client scoped to a specific user's JWT.
 * This avoids the "shared client session conflict" problem where
 * multiple users' auth sessions overwrite each other on a single client.
 *
 * Usage in routes: const supabase = createUserClient(req.headers.authorization);
 */
function createUserClient(authHeader) {
    const options = {};

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        options.global = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }

    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        options
    );
}

/**
 * Create an anonymous Supabase client (no user session).
 * Use this for auth operations (signup, login) where no user token exists yet.
 */
function createAnonClient() {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );
}

module.exports = { supabaseAdmin, createUserClient, createAnonClient };
