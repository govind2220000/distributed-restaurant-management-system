import { useState } from 'react';

// Mock menu data
const menuItems = [
  'Margherita Pizza',
  'Chicken Burger',
  'Caesar Salad',
  'Pasta Alfredo',
  'Fish and Chips'
];

const OrderForm = () => {
  const [orderItems, setOrderItems] = useState([]);

  const updateQuantity = (itemName) => {
    setOrderItems(prevItems => {
      const existingItem = prevItems.find(item => item.name === itemName);
      
      if (existingItem) {
        // We will update quantity if item it already exists in orderItems state variable
        return prevItems.map(item => 
          item.name === itemName 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item if it doesn't exist in orderItems state variable and set quantity to 1
        return [...prevItems, { name: itemName, quantity: 1 }];
      }
    });
  };

  const decreaseQuantity = (itemName) => {
    setOrderItems(prevItems => {
      const updatedItems = prevItems.map(item => 
        item.name === itemName 
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ).filter(item => item.quantity > 0); // We will remove any existing item if quantity is 0
      
      return updatedItems;
    });
  };


  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to your order');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: orderItems })
      });

      if (!response.ok) throw new Error('Failed to place order');

      setOrderItems([]);
      alert('Order placed successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="menu-grid">
      {menuItems.map(itemName => (
        <div key={itemName} className="menu-card">
          <h3>{itemName}</h3>
          <div className="quantity-controls">
            <button 
              onClick={() => decreaseQuantity(itemName)}
              disabled={!orderItems.find(item => item.name === itemName)}
            >
              -
            </button>
            <span>
              {orderItems.find(item => item.name === itemName)?.quantity || 0}
            </span>
            <button onClick={() => updateQuantity(itemName)}>
              +
            </button>
          </div>
        </div>
      ))}
      <button 
        className="place-order-btn"
        onClick={handleSubmit}
        disabled={orderItems.length === 0}
      >
        Place Order
      </button>
    </div>
  );
};

export default OrderForm; 