import { useState } from 'react'
import './App.css'
import './components/styles.css'
import OrderForm from './components/OrderForm'
import OrderStatus from './components/OrderStatus'

function App() {
  const [activeTab, setActiveTab] = useState('place-order')

  return (
    <div className="app">
      <header>
        <h1>Restaurant Order Management</h1>
        <nav>
          <button 
            className={activeTab === 'place-order' ? 'active' : ''} 
            onClick={() => setActiveTab('place-order')}
          >
            Place Order
          </button>
          <button 
            className={activeTab === 'order-status' ? 'active' : ''} 
            onClick={() => setActiveTab('order-status')}
          >
            Order Status
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'place-order' ? <OrderForm /> : <OrderStatus />}
      </main>
    </div>
  )
}

export default App
