const { createClient } = require('@supabase/supabase-js');

// Public client (uses anon key — respects RLS policies)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Admin client (uses service role key — bypasses RLS, for admin operations only)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase, supabaseAdmin };
