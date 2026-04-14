
document.addEventListener("DOMContentLoaded", function () {
    // --- State Management ---
    let cart = JSON.parse(localStorage.getItem('rn_cart')) || [];
    let currentUser = JSON.parse(localStorage.getItem('rn_user')) || null;
    let orders = JSON.parse(localStorage.getItem('rn_orders')) || [];

    // --- Theme Toggle Setup ---
    const savedTheme = localStorage.getItem('rn_theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');

    // Inject Theme Toggle Icon
    const navIcons = document.querySelector('.nav-icons');
    if (navIcons) {
        const themeToggleBtn = document.createElement('div');
        themeToggleBtn.className = 'nav-icon theme-toggle-btn';
        themeToggleBtn.title = 'Toggle Dark/Light Mode';
        themeToggleBtn.style.cursor = 'pointer';
        themeToggleBtn.innerHTML = `<i class="fas ${savedTheme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
        
        // Insert before the first icon
        navIcons.insertBefore(themeToggleBtn, navIcons.firstChild);

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

    // --- CART FUNCTIONS ---

    function updateCartCount() {
        if (cartCount) {
            const count = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = count;
        }
    }

    function saveCart() {
        localStorage.setItem('rn_cart', JSON.stringify(cart));
        updateCartCount();
    }

    // Function to update quantity
    window.updateQuantity = function (id, delta) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            saveCart();
            // Re-render based on current page
            if (document.getElementById('cartPageItems')) renderCartPage();
            if (document.getElementById('checkoutOrderItems')) renderCheckoutSummary();
        }
    };

    window.removeItem = function (id) {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        if (document.getElementById('cartPageItems')) renderCartPage();
    };

    // --- DEDICATED CART PAGE RENDERING ---
    window.renderCartPage = function () {
        const container = document.getElementById('cartPageItems');
        const emptyState = document.getElementById('emptyCartState');
        const cartContent = document.getElementById('cartPageContainer');

        if (!container) return;

        if (cart.length === 0) {
            cartContent.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        cartContent.style.display = 'flex';
        emptyState.style.display = 'none';

        container.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
            const itemHtml = `
                <div class="cart-item-row">
                    <div class="cart-item-image-box">
                        ${item.image ? `<img src="${item.image}">` : `<i class="fas fa-leaf"></i>`}
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                            <input type="text" class="qty-input" value="${item.quantity}" readonly>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price-row">
                            <span class="current-price">₹${item.price}</span>
                            <span class="original-price">₹${Math.round(item.price * 1.2)}</span>
                        </div>
                        <div class="remove-item-btn" onclick="removeItem('${item.id}')">Remove</div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHtml);
        });

        // Update Summary
        document.getElementById('cartItemCount').textContent = cart.length;
        document.getElementById('summaryItemCount').textContent = cart.length;
        document.getElementById('summarySubtotal').textContent = `₹${total}`;
        document.getElementById('summaryTotal').textContent = `₹${total}`;
        const savings = Math.round(total * 0.2);
        document.querySelector('.savings-text').textContent = `You will save ₹${savings} on this order`;
    };

    const btnGoToCheckout = document.getElementById('btnGoToCheckout');
    if (btnGoToCheckout) {
        btnGoToCheckout.addEventListener('click', () => {
            if (!currentUser) {
                alert("Please login to continue");
                window.location.href = 'login.html';
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    // --- CHECKOUT LOGIC ---
    window.initCheckout = function () {
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        renderCheckoutSummary();

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
            btnPlaceOrderFinal.addEventListener('click', () => {
                const shipping = JSON.parse(localStorage.getItem('rn_shipping'));
                const order = {
                    orderId: "ORD-" + Math.floor(Math.random() * 1000000),
                    user: currentUser.email,
                    items: cart,
                    shipping: shipping,
                    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
                    status: 'confirmed',
                    date: new Date().toLocaleDateString()
                };

                orders.push(order);
                localStorage.setItem('rn_orders', JSON.stringify(orders));
                localStorage.setItem('rn_last_order', JSON.stringify(order));

                // Clear Cart
                cart = [];
                saveCart();

                // Send WhatsApp
                sendOrderWhatsApp(order);

                window.location.href = 'order-success.html';
            });
        }
    };

    function goToStep(stepNumber) {
        document.querySelectorAll('.step-item').forEach(step => step.classList.remove('active'));
        document.getElementById(`step${stepNumber}`).classList.add('active');
    }

    function renderCheckoutSummary() {
        const container = document.getElementById('checkoutOrderItems');
        if (!container) return;

        let total = 0;
        container.innerHTML = '';
        cart.forEach(item => {
            total += item.price * item.quantity;
            container.insertAdjacentHTML('beforeend', `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>₹${item.price * item.quantity}</span>
                </div>
            `);
        });

        const count = cart.length;
        document.getElementById('checkItemCount').textContent = count;
        document.getElementById('checkSubtotal').textContent = `₹${total}`;
        document.getElementById('checkTotal').textContent = `₹${total}`;
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
    window.renderOrderHistory = function () {
        const list = document.getElementById('orderHistoryList');
        if (!list) return;

        const myOrders = orders.filter(o => o.user === currentUser.email).reverse();

        if (myOrders.length === 0) {
            list.innerHTML = '<p style="text-align: center; padding: 40px;">No orders found.</p>';
            return;
        }

        list.innerHTML = '';
        myOrders.forEach(order => {
            const firstItem = order.items[0];
            const itemHtml = `
                <div class="order-history-card">
                    <div class="order-history-info">
                        ${firstItem.image ? `<img src="${firstItem.image}" class="order-history-img">` : `<i class="fas fa-leaf" style="font-size: 2rem;"></i>`}
                        <div>
                            <div style="font-weight: 600;">${firstItem.name} ${order.items.length > 1 ? ` & ${order.items.length - 1} more` : ''}</div>
                            <div style="font-size: 0.9rem; color: #878787;">Order ID: ${order.orderId}</div>
                        </div>
                    </div>
                    <div style="font-weight: 600;">₹${order.total}</div>
                    <div style="color: #388e3c; font-weight: 600;">● Confirmed on ${order.date}</div>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', itemHtml);
        });
    };

    // --- PRODUCT UI LOGIC ---

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.plant-card') || e.target.closest('.material-card');
            if (!card) return;
            const id = card.getAttribute('data-id');
            const name = card.getAttribute('data-name');
            const price = parseInt(card.getAttribute('data-price'));

            // Extract image or icon
            let image = "";
            const imgTag = card.querySelector('img');
            if (imgTag) {
                image = imgTag.src;
            }

            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ id, name, price, quantity: 1, image: image });
            }

            saveCart();
            alert(`${name} added to cart`);
            updateCartCount();
        });
    });

    // --- HELPER FUNCTIONS ---
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.toLowerCase());
    }

    // --- AUTH & LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!isValidEmail(email)) {
                alert("Please enter a valid email address.");
                return;
            }

            if (email && password) {
                const user = { email: email, name: email.split('@')[0] };
                localStorage.setItem('rn_user', JSON.stringify(user));
                alert("Login successful");
                window.location.href = "plants.html";
            }
        });
    }

    // Signup Form Handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();

            if (name.length < 2) {
                alert("Please enter your full name.");
                return;
            }

            if (!isValidEmail(email)) {
                alert("Please enter a valid email address.");
                return;
            }

            const user = { email: email, name: name };
            localStorage.setItem('rn_user', JSON.stringify(user));
            alert("Account created!");
            window.location.href = 'plants.html';
        });
    }

    // --- AUTH UI + LOGOUT ---
    const loginIconLink = document.querySelector('.nav-icon[title="Login / Register"]');

    if (currentUser && loginIconLink) {
        const parent = loginIconLink.parentElement;
        const userDropdown = document.createElement('div');
        userDropdown.className = 'user-dropdown';

        const avatarInitial = currentUser.name.charAt(0).toUpperCase();
        const isAdmin = currentUser.email === 'manishndabade2006@gmail.com';
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

        document.getElementById('btnLogout').addEventListener('click', () => {
            localStorage.removeItem('rn_user');
            alert("Logged out successfully");
            window.location.reload();
        });
    }

    // --- CHARACTER COUNTER FOR CONTACT FORM ---
    const messageTextarea = document.getElementById('message');
    const charCountDisplay = document.getElementById('charCountDisplay');
    if (messageTextarea && charCountDisplay) {
        const maxLength = messageTextarea.getAttribute('maxlength');
        messageTextarea.addEventListener('input', () => {
            const currentLength = messageTextarea.value.length;
            charCountDisplay.textContent = `${currentLength} / ${maxLength} characters`;
            if (currentLength >= maxLength) {
                charCountDisplay.style.color = 'red';
            } else {
                charCountDisplay.style.color = '#666';
            }
        });
    }

    // Initial Load
    updateCartCount();
});