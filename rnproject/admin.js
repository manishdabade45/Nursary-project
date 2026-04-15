document.addEventListener("DOMContentLoaded", async function () {
    // --- Access Control (via API) ---
    const currentUser = API.getCurrentUser();

    if (!API.isLoggedIn()) {
        alert("Please login to access the admin dashboard.");
        window.location.href = "login.html";
        return;
    }

    if (!currentUser || currentUser.role !== 'admin') {
        alert("Access Denied: Administrative privileges required.");
        window.location.href = "index.html";
        return;
    }

    // --- Stats Elements ---
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalSalesEl = document.getElementById('totalSales');
    const totalCustomersEl = document.getElementById('totalCustomers');
    const totalPlantsSoldEl = document.getElementById('totalPlantsSold');
    const orderTableBody = document.getElementById('orderTableBody');

    // --- Load Dashboard Data ---
    async function loadDashboard() {
        await Promise.all([loadStats(), loadOrders()]);
    }

    // --- Stats Logic (from API) ---
    async function loadStats() {
        try {
            const result = await API.adminGetStats();
            if (result.success) {
                const stats = result.data;
                if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders;
                if (totalSalesEl) totalSalesEl.textContent = `₹${stats.totalSales}`;
                if (totalCustomersEl) totalCustomersEl.textContent = stats.totalCustomers;
                if (totalPlantsSoldEl) totalPlantsSoldEl.textContent = stats.totalPlantsSold;
            }
        } catch (err) {
            console.error('Failed to load stats:', err.message);
            if (totalOrdersEl) totalOrdersEl.textContent = 'Error';
            if (totalSalesEl) totalSalesEl.textContent = 'Error';
        }
    }

    // --- Orders Table (from API) ---
    async function loadOrders() {
        if (!orderTableBody) return;

        try {
            const result = await API.adminGetOrders();

            if (!result.success || result.data.length === 0) {
                orderTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found.</td></tr>';
                return;
            }

            orderTableBody.innerHTML = '';
            result.data.forEach(order => {
                const orderDate = new Date(order.created_at).toLocaleDateString();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${order.order_id}</strong></td>
                    <td>${order.user_email}</td>
                    <td>${orderDate}</td>
                    <td>₹${order.total}</td>
                    <td><span class="status-badge status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-small" onclick="updateOrderStatus('${order.order_id}', 'completed')">Complete</button>
                        <button class="btn btn-danger btn-small" onclick="updateOrderStatus('${order.order_id}', 'cancelled')">Cancel</button>
                    </td>
                `;
                orderTableBody.appendChild(row);
            });
        } catch (err) {
            console.error('Failed to load orders:', err.message);
            orderTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Failed to load orders: ${err.message}</td></tr>`;
        }
    }

    // --- Exposed Functions ---
    window.updateOrderStatus = async function (orderId, newStatus) {
        try {
            const result = await API.adminUpdateOrderStatus(orderId, newStatus);
            if (result.success) {
                alert(`Order ${orderId} updated to ${newStatus}`);
                await loadDashboard(); // Refresh stats + table
            } else {
                alert('Failed to update order: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Update order error:', err.message);
            alert('Error updating order: ' + err.message);
        }
    };

    window.exportData = async function () {
        try {
            const result = await API.adminGetOrders();

            if (!result.success || result.data.length === 0) {
                alert("No data to export!");
                return;
            }

            const orders = result.data;
            let csv = 'OrderID,Customer,Date,Total,Status\n';
            orders.forEach(order => {
                const orderDate = new Date(order.created_at).toLocaleDateString();
                csv += `${order.order_id},${order.user_email},${orderDate},${order.total},${order.status}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', 'rn_orders_data.csv');
            a.click();
        } catch (err) {
            console.error('Export error:', err.message);
            alert('Failed to export: ' + err.message);
        }
    };

    // Initial Render
    await loadDashboard();
});