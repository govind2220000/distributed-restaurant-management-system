import { useState, useEffect } from 'react';

const OrderStatus = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/bulkorders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error fetching orders: ' + err.message);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchOrders();

    // Set up polling every 5 seconds
    const pollInterval = setInterval(fetchOrders, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(pollInterval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Queue':
        return '#ffd700'; // Gold
      case 'Preparing':
        return '#ff8c00'; // Dark Orange
      case 'Ready for Pickup':
        return '#32cd32'; // Lime Green
      case 'Completed':
        return '#008000'; // Green
      default:
        return '#808080'; // Gray
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="order-status">
      <h2>Order Status</h2>
      <div className="orders-grid">
        {orders.length === 0 ? (
          <p>No orders found</p>
        ) : (
          orders.map((order) => (
            <div 
              key={order.orderId} 
              className="order-card"
              style={{ borderColor: getStatusColor(order.status) }}
            >
              <h3>Order #{order.orderId}</h3>
              <p><strong>Customer:</strong> {order.customerName}</p>
              <p><strong>Status:</strong> <span style={{ color: getStatusColor(order.status) }}>{order.status}</span></p>
              <div className="order-items">
                <strong>Items:</strong>
                <ul>
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.name} x {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="order-time">
                <small>Ordered: {new Date(order.createdAt).toLocaleString()}</small>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderStatus; 