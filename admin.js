
document.addEventListener("DOMContentLoaded", function () {
    const orders = JSON.parse(localStorage.getItem('rn_orders')) || [];
    
    // --- Stats Elements ---
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalSalesEl = document.getElementById('totalSales');
    const totalCustomersEl = document.getElementById('totalCustomers');
    const totalPlantsSoldEl = document.getElementById('totalPlantsSold');
    const orderTableBody = document.getElementById('orderTableBody');

    // --- Stats Logic ---
    function updateStats() {
        const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const customers = [...new Set(orders.map(order => order.user))];
        const plantsSold = orders.reduce((sum, order) => {
            return sum + (order.items ? order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) : 0);
        }, 0);

        if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
        if (totalSalesEl) totalSalesEl.textContent = `₹${totalSales}`;
        if (totalCustomersEl) totalCustomersEl.textContent = customers.length;
        if (totalPlantsSoldEl) totalPlantsSoldEl.textContent = plantsSold;
    }

    function renderOrderTable() {
        if (!orderTableBody) return;
        
        orderTableBody.innerHTML = '';
        
        if (orders.length === 0) {
            orderTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found.</td></tr>';
            return;
        }

        // Show orders in reverse chronological order (newest first)
        const sortedOrders = [...orders].reverse();

        sortedOrders.forEach((order, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${order.orderId}</strong></td>
                <td>${order.user}</td>
                <td>${order.date}</td>
                <td>₹${order.total}</td>
                <td><span class="status-badge status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="updateOrderStatus('${order.orderId}', 'completed')">Complete</button>
                    <button class="btn btn-danger btn-small" onclick="updateOrderStatus('${order.orderId}', 'cancelled')">Cancel</button>
                </td>
            `;
            orderTableBody.appendChild(row);
        });
    }

    // --- Exposed Functions ---
    window.updateOrderStatus = function(orderId, newStatus) {
        const index = orders.findIndex(o => o.orderId === orderId);
        if (index !== -1) {
            orders[index].status = newStatus;
            localStorage.setItem('rn_orders', JSON.stringify(orders));
            updateStats();
            renderOrderTable();
            alert(`Order ${orderId} updated to ${newStatus}`);
        }
    };

    window.exportData = function() {
        if (orders.length === 0) {
            alert("No data to export!");
            return;
        }
        
        let csv = 'OrderID,Customer,Date,Total,Status\n';
        orders.forEach(order => {
            csv += `${order.orderId},${order.user},${order.date},${order.total},${order.status}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'rn_orders_data.csv');
        a.click();
    };

    // Initial Render
    updateStats();
    renderOrderTable();
});
