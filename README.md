# 🪴 R.N. Agritech Services

> **Full Stack E-Commerce & Agricultural Consultancy Website**
> Built with HTML, CSS, JavaScript (Vanilla), Node.js, Express, and Supabase.

Welcome to the **R.N. Agritech Services** project repository! This is a complete, production-ready web application designed for a landscape gardening and agricultural consultancy business in Pune, India. 

![R.N. Agritech Logo](rnproject/logo.png)

## 📁 Repository Structure

The project has been architected into two clearly separated directories for a clean Full-Stack experience:

### 1. `/rnproject` (Frontend UI)
This directory contains the user interface and client-side logic.
- Beautiful, highly responsive, and dynamic UI using raw semantic HTML5 and vanilla CSS3.
- Dark mode toggle, interactive shopping cart, checkout flow, and custom animations.
- Contains `api.js` which dynamically communicates with the backend server via HTTP fetch requests. No raw database keys are ever exposed here!
- Contains an **Admin Dashboard** (`admin.html`) designed specifically to view customer orders and business metrics.

### 2. `/Backend` (API Server)
This directory contains the secure backend engine protecting the application.
- Built using **Node.js** and **Express.js**.
- Employs **@supabase/supabase-js** to handle user Authentication, JSON Web Tokens (JWT), and Postgres Database operations safely.
- Implements strict **Middleware**, ensuring the Shopping Cart, Checkout, and Admin Dashboard can only be accessed by appropriately authenticated (or Admin) users.
- Built-in CORS protection and environment variable secrets caching.

---

## ⚡ Core Features

- **Secure Authentication:** Users can register and login utilizing Supabase Auth.
- **Cross-session Shopping Cart:** Guest users can add items locally. Upon login, the guest cart cleverly synchronizes with the server-side database.
- **Role-Based Access Control:** Users designated as `admin` in the database gain exclusive access to view global statistics and modify Order status (e.g. Pending to Complete). 
- **Row-Level Security (RLS):** Safely implemented in SQL so that users can strictly only view shopping carts and orders that belong to them.
- **WhatsApp Integration:** Checking out seamlessly triggers a dynamic WhatsApp integration that formats the customer's cart list and shipping details exactly to the store owner's number.

---

## 🚀 Setup & Installation

Follow these steps to run the complete environment locally on your machine.

### Prerequisites:
* You must have **Node.js** installed on your computer.
* You need a free **Supabase** account to host the database.

### 1. Database Setup
1. Log into your Supabase Dashboard and create a new project.
2. Go to the **SQL Editor**, and copy in the exact contents of `Backend/database/schema.sql`.
3. Click "Run" to automatically generate all 4 protected e-commerce tables: `users`, `cart`, `orders`, and `order_items`.

### 2. Backend Config
1. Open the `.env` file located inside the `Backend` directory.
2. Provide your specific Supabase API keys:
   ```env
   SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
   SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SECRET_ROLE_KEY
   PORT=5000
   ```
3. Open your terminal in the `Backend` folder and install packages: 
   ```bash
   npm install
   ```
4. Start the backend Node server:
   ```bash
   npm start
   ```

### 3. Running the Frontend
With the Backend server alive and successfully listening on port `5000`:
1. Use **Live Server** (via VS Code) on `/rnproject/index.html` OR simply double click the file.
2. Experience the complete end-to-end shopping journey!

*** 

*Maintained by Manish Dabade*
