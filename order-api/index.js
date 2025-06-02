require('dotenv').config();
const express = require('express');
const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Order = require('./models/Order');

const app = express();
app.use(express.json());

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const MONGODB_URI = process.env.MONGODB_URI;
const ORDER_QUEUE = 'orders';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function start() {
  await connectDB();
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(ORDER_QUEUE, { durable: true });

  // Endpoint for Creating order in MongoDB
  app.post('/orders', async (req, res) => {
    try {
      const orderId = uuidv4();
      
      // Create order in MongoDB first
      const orderData = {
        orderId: orderId,
        items: req.body.items,
        status: 'Received',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const savedOrder = await Order.create(orderData);
      console.log('Order saved to database:', savedOrder);

      // Send to queue for processing
      const queueMessage = {
        id: orderId,
        items: req.body.items
      };
      
      channel.sendToQueue(ORDER_QUEUE, Buffer.from(JSON.stringify(queueMessage)));
      res.status(201).json(savedOrder);
    } catch (err) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Endpoint for fetching all orders from MongoDB
  app.get('/bulkorders', async (req, res) => {
    try {
      const order = await Order.find();
      if(!order) return res.status(404).json({ error: 'Order not found' });
      res.json(order);
    } catch (err) {
      console.error('Error fetching order:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.listen(3000, () => console.log('Order API running on port 3000'));
}

start().catch(console.error);