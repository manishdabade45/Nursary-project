
document.addEventListener("DOMContentLoaded", function () {
    // --- State Management ---
    // currentUser is now loaded from localStorage (set by API.login/signup)
    let currentUser = API.getCurrentUser();

    // --- Theme Toggle Setup ---
    const savedTheme = localStorage.getItem('rn_theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');

    // Inject Theme Toggle Icon if it doesn't exist natively
    const navIcons = document.querySelector('.nav-icons');
    let themeToggleBtn = document.getElementById('themeToggle');
    
    if (!themeToggleBtn && navIcons) {
        themeToggleBtn = document.createElement('div');
        themeToggleBtn.className = 'nav-icon theme-toggle-btn';
        themeToggleBtn.id = 'themeToggle';
        themeToggleBtn.title = 'Toggle Dark/Light Mode';
        themeToggleBtn.style.cursor = 'pointer';
        navIcons.insertBefore(themeToggleBtn, navIcons.firstChild);
    }

    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = `<i class="fas ${savedTheme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('rn_theme', isDark ? 'dark' : 'light');
            themeToggleBtn.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;
        });
    }

    // --- Selectors ---
    const navMenu = document.getElementById('navMenu');
    const cartToggle = document.getElementById('cartToggle');
    const closeCart = document.getElementById('closeCart');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    const btnCheckout = document.querySelector('.btn-checkout');
    const faqItems = document.querySelectorAll(".faq-item");

    // --- UI Logic ---

    // Toggle Cart
    if (cartToggle) {
        cartToggle.addEventListener('click', () => {
            // Redirect to cart page instead of sidebar for better Flipkart-like experience
            window.location.href = 'cart.html';
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
        });
    }

    // FAQ Toggle
    faqItems.forEach(item => {
        const summary = item.querySelector(".faq-question");
        if (summary) {
            summary.addEventListener("click", function (e) {
                e.preventDefault();
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.removeAttribute("open");
                    }
                });

                if (item.hasAttribute("open")) {
                    item.removeAttribute("open");
                } else {
                    item.setAttribute("open", "true");
                }
            });
        }
    });

    // --- CART FUNCTIONS (Now uses API) ---

    async function updateCartCount() {
        if (!cartCount) return;
        try {
            const result = await API.getCart();
            if (result.success) {
                cartCount.textContent = result.data.totalItems || 0;
            }
        } catch (err) {
            // Fallback: read from localStorage guest cart
            const guestCart = JSON.parse(localStorage.getItem('rn_cart') || '[]');
            const count = guestCart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = count;
        }
    }

    // Function to update quantity (exposed globally for onclick handlers)
    window.updateQuantity = async function (id, delta) {
        try {
            if (API.isLoggedIn()) {
                // For logged-in users, we need to get current cart to find the item
                const result = await API.getCart();
                if (result.success) {
                    const item = result.data.items.find(i => i.id === id || i.product_id === id);
                    if (item) {
                        const newQty = item.quantity + delta;
                        if (newQty <= 0) {
                            await API.removeCartItem(item.id);
                        } else {
                            await API.updateCartItem(item.id, newQty);
                        }
                    }
                }
            } else {
                // Guest mode
                const cart = JSON.parse(localStorage.getItem('rn_cart') || '[]');
                const item = cart.find(i => i.id === id);
                if (item) {
                    item.quantity += delta;
                    if (item.quantity <= 0) {
                        const filtered = cart.filter(i => i.id !== id);
                        localStorage.setItem('rn_cart', JSON.stringify(filtered));
                    } else {
                        localStorage.setItem('rn_cart', JSON.stringify(cart));
                    }
                }
            }

            // Re-render based on current page
            if (document.getElementById('cartPageItems')) await renderCartPage();
            if (document.getElementById('checkoutOrderItems')) await renderCheckoutSummary();
            await updateCartCount();
        } catch (err) {
            console.error('Update quantity error:', err.message);
        }
    };

    window.removeItem = async function (id) {
        try {
            if (API.isLoggedIn()) {
                const result = await API.getCart();
                if (result.success) {
                    const item = result.data.items.find(i => i.id === id || i.product_id === id);
                    if (item) {
                        await API.removeCartItem(item.id);
                    }
                }
            } else {
                const cart = JSON.parse(localStorage.getItem('rn_cart') || '[]');
                localStorage.setItem('rn_cart', JSON.stringify(cart.filter(i => i.id !== id)));
            }
            if (document.getElementById('cartPageItems')) await renderCartPage();
            await updateCartCount();
        } catch (err) {
            console.error('Remove item error:', err.message);
        }
    };

    // --- DEDICATED CART PAGE RENDERING ---
    window.renderCartPage = async function () {
        const container = document.getElementById('cartPageItems');
        const emptyState = document.getElementById('emptyCartState');
        const cartContent = document.getElementById('cartPageContainer');

        if (!container) return;

        try {
            const result = await API.getCart();
            const items = result.success ? result.data.items : [];

            if (items.length === 0) {
                cartContent.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            cartContent.style.display = 'flex';
            emptyState.style.display = 'none';

            container.innerHTML = '';
            let total = 0;

            items.forEach(item => {
                const itemId = item.id || item.product_id;
                const price = parseFloat(item.price);
                total += price * item.quantity;
                const itemHtml = `
                    <div class="cart-item-row">
                        <div class="cart-item-image-box">
                            ${item.image ? `<img src="${item.image}">` : `<i class="fas fa-leaf"></i>`}
                            <div class="qty-controls">
                                <button class="qty-btn" onclick="updateQuantity('${itemId}', -1)">-</button>
                                <input type="text" class="qty-input" value="${item.quantity}" readonly>
                                <button class="qty-btn" onclick="updateQuantity('${itemId}', 1)">+</button>
                            </div>
                        </div>
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price-row">
                                <span class="current-price">₹${price}</span>
                                <span class="original-price">₹${Math.round(price * 1.2)}</span>
                            </div>
                            <div class="remove-item-btn" onclick="removeItem('${itemId}')">Remove</div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', itemHtml);
            });

            // Update Summary
            document.getElementById('cartItemCount').textContent = items.length;
            document.getElementById('summaryItemCount').textContent = items.length;
            document.getElementById('summarySubtotal').textContent = `₹${total}`;
            document.getElementById('summaryTotal').textContent = `₹${total}`;
            const savings = Math.round(total * 0.2);
            document.querySelector('.savings-text').textContent = `You will save ₹${savings} on this order`;
        } catch (err) {
            console.error('Render cart error:', err.message);
            cartContent.style.display = 'none';
            emptyState.style.display = 'block';
        }
    };

    const btnGoToCheckout = document.getElementById('btnGoToCheckout');
    if (btnGoToCheckout) {
        btnGoToCheckout.addEventListener('click', () => {
            if (!API.isLoggedIn()) {
                alert("Please login to continue");
                window.location.href = 'login.html';
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    // --- CHECKOUT LOGIC ---
    window.initCheckout = async function () {
        if (!API.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        await renderCheckoutSummary();

        // Step 1: Login
        const userEmailSpan = document.querySelector('#checkoutUserEmail span');
        if (userEmailSpan) userEmailSpan.textContent = currentUser.email;

        const btnNext1 = document.getElementById('btnNext1');
        if (btnNext1) {
            btnNext1.addEventListener('click', () => {
                goToStep(2);
            });
        }

        // Step 2: Address
        const shippingForm = document.getElementById('shippingForm');
        if (shippingForm) {
            shippingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const address = {
                    name: document.getElementById('shipName').value,
                    phone: document.getElementById('shipPhone').value,
                    address: document.getElementById('shipAddress').value,
                    city: document.getElementById('shipCity').value,
                    pincode: document.getElementById('shipPincode').value
                };
                localStorage.setItem('rn_shipping', JSON.stringify(address));
                goToStep(3);
            });
        }

        // Step 3: Summary
        const btnNext3 = document.getElementById('btnNext3');
        if (btnNext3) {
            btnNext3.addEventListener('click', () => {
                goToStep(4);
            });
        }

        // Step 4: Final Place Order
        const btnPlaceOrderFinal = document.getElementById('btnPlaceOrderFinal');
        if (btnPlaceOrderFinal) {
            btnPlaceOrderFinal.addEventListener('click', async () => {
                try {
                    const shipping = JSON.parse(localStorage.getItem('rn_shipping'));
                    const cartResult = await API.getCart();

                    if (!cartResult.success || cartResult.data.items.length === 0) {
                        alert('Your cart is empty!');
                        return;
                    }

                    const items = cartResult.data.items;
                    const total = cartResult.data.totalPrice;

                    // Place order via API (also clears cart on server)
                    const orderResult = await API.placeOrder(items, shipping, total);

                    if (orderResult.success) {
                        // Save last order for success page
                        localStorage.setItem('rn_last_order', JSON.stringify(orderResult.data));

                        // Send WhatsApp notification
                        sendOrderWhatsApp({
                            orderId: orderResult.data.orderId,
                            total: orderResult.data.total || total,
                            shipping: shipping,
                            items: items
                        });

                        window.location.href = 'order-success.html';
                    } else {
                        alert('Failed to place order: ' + (orderResult.error || 'Unknown error'));
                    }
                } catch (err) {
                    console.error('Place order error:', err.message);
                    alert('Error placing order: ' + err.message);
                }
            });
        }
    };

    function goToStep(stepNumber) {
        document.querySelectorAll('.step-item').forEach(step => step.classList.remove('active'));
        document.getElementById(`step${stepNumber}`).classList.add('active');
    }

    async function renderCheckoutSummary() {
        const container = document.getElementById('checkoutOrderItems');
        if (!container) return;

        try {
            const result = await API.getCart();
            const items = result.success ? result.data.items : [];

            let total = 0;
            container.innerHTML = '';
            items.forEach(item => {
                const price = parseFloat(item.price);
                total += price * item.quantity;
                container.insertAdjacentHTML('beforeend', `
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                        <span>${item.name} x ${item.quantity}</span>
                        <span>₹${price * item.quantity}</span>
                    </div>
                `);
            });

            const count = items.length;
            document.getElementById('checkItemCount').textContent = count;
            document.getElementById('checkSubtotal').textContent = `₹${total}`;
            document.getElementById('checkTotal').textContent = `₹${total}`;
        } catch (err) {
            console.error('Checkout summary error:', err.message);
        }
    }

    function sendOrderWhatsApp(order) {
        let message = `*Order Confirmed - R.N. Agritech Services*\n\n`;
        message += `*Order ID:* ${order.orderId}\n`;
        message += `*Total Amount:* ₹${order.total}\n\n`;
        message += `*Shipping Address:*\n`;
        message += `${order.shipping.name}\n${order.shipping.address}\n${order.shipping.city} - ${order.shipping.pincode}\nPh: ${order.shipping.phone}\n\n`;
        message += `*Items:*\n`;
        order.items.forEach(item => {
            message += `- ${item.name} x ${item.quantity}\n`;
        });

        const encodedMessage = encodeURIComponent(message);
        const whatsappNumber = "9886718202";
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    }

    // --- ORDER HISTORY ---
    window.renderOrderHistory = async function () {
        const list = document.getElementById('orderHistoryList');
        if (!list) return;

        if (!API.isLoggedIn()) {
            list.innerHTML = '<p style="text-align: center; padding: 40px;">Please login to view orders.</p>';
            return;
        }

        try {
            const result = await API.getOrders();
            const myOrders = result.success ? result.data : [];

            if (myOrders.length === 0) {
                list.innerHTML = '<p style="text-align: center; padding: 40px;">No orders found.</p>';
                return;
            }

            list.innerHTML = '';
            myOrders.forEach(order => {
                const firstItem = order.order_items?.[0] || {};
                const itemCount = order.order_items?.length || 0;
                const orderDate = new Date(order.created_at).toLocaleDateString();
                const itemHtml = `
                    <div class="order-history-card">
                        <div class="order-history-info">
                            ${firstItem.image ? `<img src="${firstItem.image}" class="order-history-img">` : `<i class="fas fa-leaf" style="font-size: 2rem;"></i>`}
                            <div>
                                <div style="font-weight: 600;">${firstItem.product_name || 'Order'} ${itemCount > 1 ? ` & ${itemCount - 1} more` : ''}</div>
                                <div style="font-size: 0.9rem; color: #878787;">Order ID: ${order.order_id}</div>
                            </div>
                        </div>
                        <div style="font-weight: 600;">₹${order.total}</div>
                        <div style="color: ${order.status === 'cancelled' ? '#d32f2f' : '#388e3c'}; font-weight: 600;">● ${order.status.charAt(0).toUpperCase() + order.status.slice(1)} on ${orderDate}</div>
                    </div>
                `;
                list.insertAdjacentHTML('beforeend', itemHtml);
            });
        } catch (err) {
            console.error('Order history error:', err.message);
            list.innerHTML = '<p style="text-align: center; padding: 40px;">Failed to load orders. Is the server running?</p>';
        }
    };

    // --- PRODUCT UI LOGIC ---

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', async (e) => {
            const card = e.target.closest('.plant-card') || e.target.closest('.material-card');
            if (!card) return;
            const id = card.getAttribute('data-id');
            const name = card.getAttribute('data-name');
            const price = parseInt(card.getAttribute('data-price'));

            // Extract image
            let image = "";
            const imgTag = card.querySelector('img');
            if (imgTag) {
                image = imgTag.src;
            }

            try {
                const result = await API.addToCart({ id, name, price, image, quantity: 1 });
                alert(result.message || `${name} added to cart`);
                await updateCartCount();
            } catch (err) {
                console.error('Add to cart error:', err.message);
                alert('Failed to add item: ' + err.message);
            }
        });
    });

    // --- HELPER FUNCTIONS ---
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.toLowerCase());
    }

    // --- AUTH & LOGIN (Now uses API) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!isValidEmail(email)) {
                alert("Please enter a valid email address.");
                return;
            }

            if (!password || password.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }

            try {
                const result = await API.login(email, password);
                if (result.success) {
                    alert("Login successful!");
                    window.location.href = "plants.html";
                } else {
                    alert(result.error || "Login failed.");
                }
            } catch (err) {
                console.error('Login error:', err.message);
                alert("Login failed: " + err.message);
            }
        });
    }

    // Signup Form Handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword')?.value || '';

            if (name.length < 2) {
                alert("Please enter your full name.");
                return;
            }

            if (!isValidEmail(email)) {
                alert("Please enter a valid email address.");
                return;
            }

            if (password.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }

            try {
                const result = await API.signup(name, email, password);
                if (result.success) {
                    alert("Account created successfully!");
                    window.location.href = 'plants.html';
                } else {
                    alert(result.error || "Signup failed.");
                }
            } catch (err) {
                console.error('Signup error:', err.message);
                alert("Signup failed: " + err.message);
            }
        });
    }

    // --- AUTH UI + LOGOUT ---
    const loginIconLink = document.querySelector('.nav-icon[title="Login / Register"]');

    if (API.isLoggedIn() && currentUser && loginIconLink) {
        const parent = loginIconLink.parentElement;
        const userDropdown = document.createElement('div');
        userDropdown.className = 'user-dropdown';

        const avatarInitial = currentUser.name.charAt(0).toUpperCase();
        const isAdmin = currentUser.role === 'admin';
        const adminLink = isAdmin ? `<li><a href="admin.html"><i class="fas fa-cog"></i> Admin Dashboard</a></li>` : '';

        userDropdown.innerHTML = `
            <div class="nav-icon" id="userProfileBtn">
                <i class="fas fa-user-check"></i>
            </div>
            <div class="profile-dropdown-content" id="profileDropdown">
                <div class="profile-header">
                    <div class="avatar-large">${avatarInitial}</div>
                    <div class="profile-name">${currentUser.name}</div>
                    <div class="profile-email">${currentUser.email}</div>
                </div>
                <ul class="dropdown-menu-list">
                    <li><a href="orders.html"><i class="fas fa-shopping-bag"></i> My Orders</a></li>
                    ${adminLink}
                </ul>
                <button class="btn-logout" id="btnLogout">Sign Out</button>
            </div>
        `;

        parent.replaceChild(userDropdown, loginIconLink);

        const userProfileBtn = document.getElementById('userProfileBtn');
        const profileDropdown = document.getElementById('profileDropdown');

        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            profileDropdown.classList.remove('active');
        });

        document.getElementById('btnLogout').addEventListener('click', async () => {
            await API.logout();
            alert("Logged out successfully");
            window.location.reload();
        });
    }

    // Initial Load
    updateCartCount();
});