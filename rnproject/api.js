/**
 * R.N. Agritech Services — Frontend API Client
 * Handles all communication with the Supabase-powered backend.
 */
const API = (() => {
    // Backend base URL — change this if your server runs on a different port
    const BASE_URL = 'http://localhost:5000/api';

    // ==========================================
    // TOKEN MANAGEMENT
    // ==========================================
    function getToken() {
        const session = JSON.parse(localStorage.getItem('rn_session') || 'null');
        return session?.access_token || null;
    }

    function getRefreshToken() {
        const session = JSON.parse(localStorage.getItem('rn_session') || 'null');
        return session?.refresh_token || null;
    }

    function getSessionExpiry() {
        const session = JSON.parse(localStorage.getItem('rn_session') || 'null');
        return session?.expires_at || 0;
    }

    function saveSession(session) {
        localStorage.setItem('rn_session', JSON.stringify(session));
    }

    function clearSession() {
        localStorage.removeItem('rn_session');
        localStorage.removeItem('rn_user');
    }

    function getCurrentUser() {
        return JSON.parse(localStorage.getItem('rn_user') || 'null');
    }

    function saveUser(user) {
        localStorage.setItem('rn_user', JSON.stringify(user));
    }

    function isLoggedIn() {
        return !!getToken() && !!getCurrentUser();
    }

    /**
     * Check if the token is expired or about to expire (within 60 seconds).
     * expires_at is a Unix timestamp in seconds.
     */
    function isTokenExpired() {
        const expiresAt = getSessionExpiry();
        if (!expiresAt) return true;
        const nowSec = Math.floor(Date.now() / 1000);
        return nowSec >= (expiresAt - 60); // 60-second buffer
    }

    /**
     * Attempt to refresh the access token using the refresh_token.
     * Returns true if refresh succeeded, false otherwise.
     */
    let _refreshPromise = null; // Prevent concurrent refresh calls
    async function refreshAccessToken() {
        // If a refresh is already in progress, wait for it
        if (_refreshPromise) return _refreshPromise;

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            clearSession();
            return false;
        }

        _refreshPromise = (async () => {
            try {
                const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });

                const data = await response.json();

                if (response.ok && data.success && data.data?.session) {
                    saveSession(data.data.session);
                    if (data.data.user) saveUser(data.data.user);
                    return true;
                } else {
                    console.warn('Token refresh failed:', data.error);
                    clearSession();
                    return false;
                }
            } catch (err) {
                console.error('Token refresh error:', err.message);
                clearSession();
                return false;
            } finally {
                _refreshPromise = null;
            }
        })();

        return _refreshPromise;
    }

    // ==========================================
    // HTTP HELPERS (with auto-refresh)
    // ==========================================
    async function request(endpoint, options = {}, _isRetry = false) {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Auto-refresh token if it's expired (before making the request)
        if (isLoggedIn() && isTokenExpired() && !_isRetry) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                // Token couldn't be refreshed — force logout
                clearSession();
                window.location.href = 'login.html';
                throw new Error('Session expired. Please login again.');
            }
        }

        // Attach auth token if available
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            // Handle 401 — try refreshing token once and retry the request
            if (response.status === 401 && !_isRetry && getRefreshToken()) {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    return request(endpoint, options, true); // Retry once
                } else {
                    clearSession();
                    window.location.href = 'login.html';
                    throw new Error('Session expired. Please login again.');
                }
            }

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Make sure the backend is running on ' + BASE_URL);
            }
            throw err;
        }
    }

    function get(endpoint) {
        return request(endpoint, { method: 'GET' });
    }

    function post(endpoint, body) {
        return request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    function put(endpoint, body) {
        return request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    function del(endpoint) {
        return request(endpoint, { method: 'DELETE' });
    }

    // ==========================================
    // AUTH API
    // ==========================================
    async function signup(name, email, password) {
        const result = await post('/auth/signup', { name, email, password });
        if (result.success && result.data) {
            if (result.data.session) {
                saveSession(result.data.session);
            }
            saveUser(result.data.user);
        }
        return result;
    }

    async function login(email, password) {
        const result = await post('/auth/login', { email, password });
        if (result.success && result.data) {
            saveSession(result.data.session);
            saveUser(result.data.user);

            // Sync guest cart to server after login
            await syncGuestCart();
        }
        return result;
    }

    async function logout() {
        try {
            await post('/auth/logout', {});
        } catch (e) {
            console.warn('Logout API call failed:', e.message);
        }
        clearSession();
        return { success: true };
    }

    async function getProfile() {
        return await get('/auth/me');
    }

    // ==========================================
    // CART API (with guest fallback)
    // ==========================================

    // Guest cart uses localStorage when not logged in
    function getGuestCart() {
        return JSON.parse(localStorage.getItem('rn_cart') || '[]');
    }

    function saveGuestCart(cart) {
        localStorage.setItem('rn_cart', JSON.stringify(cart));
    }

    // Sync guest cart items to server after login
    async function syncGuestCart() {
        const guestCart = getGuestCart();
        if (guestCart.length === 0) return;

        try {
            for (const item of guestCart) {
                await post('/cart', {
                    product_id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image || '',
                    quantity: item.quantity
                });
            }
            // Clear guest cart after sync
            localStorage.removeItem('rn_cart');
        } catch (err) {
            console.error('Failed to sync guest cart:', err.message);
        }
    }

    async function getCart() {
        if (!isLoggedIn()) {
            const items = getGuestCart();
            const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
            const totalPrice = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            return { success: true, data: { items, totalItems, totalPrice } };
        }
        return await get('/cart');
    }

    async function addToCart(product) {
        if (!isLoggedIn()) {
            // Guest mode: use localStorage
            const cart = getGuestCart();
            const existing = cart.find(i => i.id === product.id);
            if (existing) {
                existing.quantity += (product.quantity || 1);
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image || '',
                    quantity: product.quantity || 1
                });
            }
            saveGuestCart(cart);
            return { success: true, message: `${product.name} added to cart.` };
        }

        return await post('/cart', {
            product_id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || '',
            quantity: product.quantity || 1
        });
    }

    async function updateCartItem(itemId, quantity) {
        if (!isLoggedIn()) {
            const cart = getGuestCart();
            if (quantity <= 0) {
                saveGuestCart(cart.filter(i => i.id !== itemId));
            } else {
                const item = cart.find(i => i.id === itemId);
                if (item) item.quantity = quantity;
                saveGuestCart(cart);
            }
            return { success: true };
        }
        return await put(`/cart/${itemId}`, { quantity });
    }

    async function removeCartItem(itemId) {
        if (!isLoggedIn()) {
            saveGuestCart(getGuestCart().filter(i => i.id !== itemId));
            return { success: true };
        }
        return await del(`/cart/${itemId}`);
    }

    async function clearCart() {
        if (!isLoggedIn()) {
            localStorage.removeItem('rn_cart');
            return { success: true };
        }
        return await del('/cart');
    }

    // ==========================================
    // ORDERS API
    // ==========================================
    async function placeOrder(items, shipping, total) {
        return await post('/orders', { items, shipping, total });
    }

    async function getOrders() {
        return await get('/orders');
    }

    async function getOrderDetails(orderId) {
        return await get(`/orders/${orderId}`);
    }

    // ==========================================
    // USER API
    // ==========================================
    async function updateProfile(data) {
        return await put('/users/profile', data);
    }

    // ==========================================
    // ADMIN API
    // ==========================================
    async function adminGetStats() {
        return await get('/admin/stats');
    }

    async function adminGetOrders(status) {
        const query = status ? `?status=${status}` : '';
        return await get(`/admin/orders${query}`);
    }

    async function adminUpdateOrderStatus(orderId, status) {
        return await put(`/admin/orders/${orderId}/status`, { status });
    }

    async function adminDeleteOrder(orderId) {
        return await del(`/admin/orders/${orderId}`);
    }

    async function adminGetUsers() {
        return await get('/admin/users');
    }

    // ==========================================
    // HEALTH CHECK
    // ==========================================
    async function healthCheck() {
        return await get('/health');
    }

    // ==========================================
    // PUBLIC API
    // ==========================================
    return {
        // Auth
        signup,
        login,
        logout,
        getProfile,
        isLoggedIn,
        getCurrentUser,
        getToken,
        clearSession,

        // Cart
        getCart,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,

        // Orders
        placeOrder,
        getOrders,
        getOrderDetails,

        // User
        updateProfile,

        // Admin
        adminGetStats,
        adminGetOrders,
        adminUpdateOrderStatus,
        adminDeleteOrder,
        adminGetUsers,

        // Utility
        healthCheck,
        BASE_URL
    };
})();
