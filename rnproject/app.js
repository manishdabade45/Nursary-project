
document.addEventListener("DOMContentLoaded", function () {
    // --- State Management ---
    let cart = JSON.parse(localStorage.getItem('rn_cart')) || [];
    let currentUser = JSON.parse(localStorage.getItem('rn_user')) || null;
    let orders = JSON.parse(localStorage.getItem('rn_orders')) || [];

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
            cartSidebar.classList.toggle('open');
            renderCart();
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

    function renderCart() {
        if (!cartItemsContainer) return;
        
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        } else {
            cart.forEach((item, index) => {
                total += item.price * item.quantity;
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-info">
                        <span class="cart-item-title">${item.name}</span>
                        <div class="cart-item-controls">
                            <span class="cart-item-quantity">Qty: ${item.quantity}</span>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <span class="cart-item-price">₹${item.price * item.quantity}</span>
                        <i class="fas fa-trash-alt remove-item" data-index="${index}"></i>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItem);
            });
        }

        if (cartTotal) cartTotal.textContent = `₹${total}`;
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                cart.splice(index, 1);
                saveCart();
                renderCart();
            });
        });
    }

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.plant-card') || e.target.closest('.material-card');
            if (!card) return;
            const id = card.getAttribute('data-id');
            const name = card.getAttribute('data-name');
            const price = parseInt(card.getAttribute('data-price'));

            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ id, name, price, quantity: 1 });
            }

            saveCart();
            alert(`${name} added to cart`);
            renderCart();
        });
    });

    // Checkout
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            if (cart.length === 0) {
                alert("Cart empty!");
                return;
            }

            if (!currentUser) {
                alert("Login required!");
                window.location.href = "login.html";
                return;
            }

            const order = {
                orderId: "ORD-" + Math.floor(Math.random() * 1000000),
                user: currentUser.email,
                items: cart,
                total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
                status: 'pending',
                date: new Date().toLocaleDateString()
            };

            orders.push(order);
            localStorage.setItem('rn_orders', JSON.stringify(orders));
            
            cart = [];
            saveCart();
            renderCart();
            alert(`Order placed! ID: ${order.orderId}`);
            cartSidebar.classList.remove('open');
        });
    }

    // --- AUTH & LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            if (email && password) {
                const user = { email: email, name: email.split('@')[0] };
                localStorage.setItem('rn_user', JSON.stringify(user));
                alert("Login successful");
                window.location.href = "plants.html";
            }
        });
    }

    // Signup Form Handler (if on login page)
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const user = { email: email, name: name };
            localStorage.setItem('rn_user', JSON.stringify(user));
            alert("Account created!");
            window.location.href = 'plants.html';
        });
    }

    // --- AUTH UI + LOGOUT (Google Style Dropdown) ---
    const loginIconLink = document.querySelector('.nav-icon[title="Login / Register"]');
    
    if (currentUser && loginIconLink) {
        const parent = loginIconLink.parentElement;
        
        // Transform the login link into a dropdown container
        const userDropdown = document.createElement('div');
        userDropdown.className = 'user-dropdown';
        
        const avatarInitial = currentUser.name.charAt(0).toUpperCase();
        
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
                    <li><a href="admin.html"><i class="fas fa-cog"></i> Admin Dashboard</a></li>
                </ul>
                <button class="btn-logout" id="btnLogout">Sign Out</button>
            </div>
        `;
        
        // Remove the existing login link and add the dropdown
        parent.replaceChild(userDropdown, loginIconLink);
        
        const userProfileBtn = document.getElementById('userProfileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            profileDropdown.classList.remove('active');
        });
        
        // Logout handler
        document.getElementById('btnLogout').addEventListener('click', () => {
            localStorage.removeItem('rn_user');
            alert("Logged out successfully");
            window.location.reload();
        });
    }

    // Initial Load
    updateCartCount();
});