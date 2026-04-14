# R.N. Agritech Services - Modern E-commerce Platform

A high-end, professional, and responsive e-commerce platform for R.N. Agritech Services, a leading landscape gardening and agricultural consultancy company based in Pune, Maharashtra, India.

## 🌿 Project Overview

This platform has evolved from a static showcase into a fully functional e-commerce ecosystem. It allows clients to browse a wide variety of plants and horticultural materials, manage their shopping carts, create accounts, and place orders with integrated WhatsApp notifications for order confirmation.

## ✨ Features

### 🛒 E-commerce & Shopping Experience
- **Flipkart-inspired Checkout**: A multi-step, seamless checkout process (Login/Signup -> Shipping Address -> Order Summary -> Confirmation).
- **Advanced Cart Management**: Dedicated cart page with real-time quantity updates, item removal, and price breakdown (Subtotal, Discounts, Savings).
- **Product Catalog**: Beautifully rendered plant and material cards with hover effects and detailed information.
- **Persistent Storage**: Uses `localStorage` to maintain cart data, user sessions, and order history across page reloads.

### 👤 User Authentication
- **Secure Login/Signup**: Simple and functional authentication system.
- **Personalized Profile**: User-specific dashboard showing order history and account details.
- **Dynamic Navigation**: Navigation bar updates based on authentication state (Login/Register vs. Profile Dropdown).

### 📱 Order Tracking & Notifications
- **Order Success Page**: Immediate confirmation after successful checkout.
- **My Orders**: Detailed view of past orders with status and timestamps.
- **WhatsApp Integration**: Automated WhatsApp message generation upon order placement, sending order details directly to the administrator.

### 📰 Information & Resources
- **Blog Section**: Dedicated space for gardening tips, company news, and agricultural insights.
- **Interactive FAQ**: Dynamic Q&A section with smooth toggle animations to assist users.
- **Comprehensive Services**: Detailed pages for Landscape Gardening, Pest Control, and Consultancy.

### 🎨 Design System
- **Premium Aesthetics**: Curated color palette (Forest Green & Gold) for a natural yet premium feel.
- **Responsive Layout**: Optimized for all devices, from desktop monitors to small mobile screens.
- **Modern Typography**: Pairings of *Inter* (sans-serif) for readability and *Playfair Display* (serif) for elegance.

## 📁 Project Structure

```
rnproject/
├── index.html          # Gateway / Landing Page
├── home.html           # Main Shop Home
├── plants.html         # Plant Product Listing
├── service.html        # Detailed Services Overview
├── blog.html           # Company Blog & News
├── about.html          # Company History & Stats
├── contact.html        # Interactive Contact Form
├── login.html          # Authentication (Login/Register)
├── cart.html           # Dedicated Shopping Cart
├── checkout.html       # Multi-step Checkout Flow
├── order-success.html  # Post-purchase Confirmation
├── orders.html         # User Order History
├── admin.html          # Admin Dashboard (Access Restricted)
├── style.css           # Global Design System & Utility Classes
├── app.js              # Core Application Logic & State Management
├── admin.js            # Admin-specific Functionality
└── assets/             # Product Images & Brand Assets
```

## 🚀 Technologies Used

- **HTML5**: Semantic markup for SEO and accessibility.
- **CSS3**: Advanced styling with Flexbox, Grid, and Custom Properties (CSS Variables).
- **JavaScript (ES6+)**: Complex logic, state management, and DOM manipulation.
- **Font Awesome 6.4.0**: Premium icon set for better UX.
- **Google Fonts**: Inter & Playfair Display typography.
- **WhatsApp API**: Direct-to-business messaging integration.

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+ (Full layout)
- **Tablet**: 768px - 1199px (Stacked grids)
- **Mobile**: < 767px (Optimized single-column)

## 📋 Functional Entry Points

1. **Shop Home** (`home.html`): View featured categories and products.
2. **Plant Store** (`plants.html`): Filter and add plants to cart.
3. **Cart** (`cart.html`): Manage items before purchase.
4. **Checkout** (`checkout.html`): Finalize shipping and confirm orders.
5. **My Orders** (`orders.html`): Track purchase history.

## 📞 Company Information

- **Company Name**: R.N. Agritech Services
- **Address**: A-2/12, Maniratna Angan, Manjri Road, Hadapsar, Pune - 411028, Maharashtra, India
- **Phone**: +91 9422009218 / +91 8087835888
- **Email**: shinden53@yahoo.in
- **GSTIN**: 27AZUPS1292B1Z0
- **PAN**: AZUPS1292B

## 🛠️ Installation & Setup

1. **Clone the repository** to your local machine.
2. **Open `index.html`** in any modern web browser.
3. **Admin Access**: Log in withauthorized developer credentials to access the Admin Dashboard.

## 📈 Future Roadmap

1. **Real Backend Integration**: Migrate from LocalStorage to a Node.js/Python backend with a database (PostgreSQL/MongoDB).
2. **Payment Gateway**: Integrate Razorpay or Stripe for automated online payments.
3. **Multi-language Support**: Add full support for Hindi and Marathi.
4. **AI Plant Care Assistant**: Implement a chatbot to help users find the right plants for their environment.

## 🔐 Security & Persistence

- **Data Persistence**: All user data (cart, orders, login) is stored locally in the browser's `localStorage` for privacy and speed.
- **Form Safety**: Includes basic client-side validation and sanitization.

---

**Built with ❤️ for R.N. Agritech Services**

*Last Updated: April 2026*
