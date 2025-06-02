const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  items: [{
    name: String,
    quantity: Number
  }],
  status: {
    type: String,
    enum: ['Received', 'Preparing', 'Ready for Pickup', 'Completed'],
    default: 'Received'
  },
  lastError: {
    type: String,
    default: null
  },
  retryCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);