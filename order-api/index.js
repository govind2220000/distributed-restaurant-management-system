require('dotenv').config();
const express = require('express');
const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Order = require('./models/Order');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const MONGODB_URI = process.env.MONGODB_URI;
const ORDER_QUEUE = 'orders';

let rabbitConnection = null;
let rabbitChannel = null;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function setupRabbitMQ() {
  try {
    rabbitConnection = await amqp.connect(RABBITMQ_URL);
    rabbitChannel = await rabbitConnection.createChannel();
    
    // Handle connection errors and closure
    rabbitConnection.on('error', (error) => {
      console.error('RabbitMQ connection error:', error);
      rabbitChannel = null;
      rabbitConnection = null;
    });

    rabbitConnection.on('close', () => {
      console.error('RabbitMQ connection closed');
      rabbitChannel = null;
      rabbitConnection = null;
    });

    return rabbitChannel;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    rabbitChannel = null;
    rabbitConnection = null;
    throw error;
  }
}

async function getChannel() {
  if (rabbitChannel && rabbitConnection && rabbitConnection.connection.stream.readable) {
    return rabbitChannel;
  }
  
  // Need to create new connection
  return await setupRabbitMQ();
}

async function publishToQueue(channel, message, retryCount = 0) {
  try {
    // Get a valid channel (either existing or new)
    channel = await getChannel();

    // Make sure queue exists and is durable
    await channel.assertQueue(ORDER_QUEUE, { 
      durable: true  // Queue will survive broker restarts
    });

    // Publish with persistence
    const published = channel.sendToQueue(
      ORDER_QUEUE,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }  // Message will be saved to disk
    );

    if (!published) {
      throw new Error('Message was not published');
    }

    console.log(`Order ${message.id} published successfully`);
    return true;
  } catch (error) {
    console.error(`Failed to publish order ${message.id}:`, error);

    // Calculate delay with exponential backoff
    const backoffDelay = Math.pow(2, retryCount + 1) * 1000;
    console.log(`Retrying publish in ${backoffDelay}ms... (Attempt ${retryCount + 1})`);
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    
    // Retry recursively with increased retry count
    return publishToQueue(channel, message, retryCount + 1);
  }
}

async function start() {
  await connectDB();
  await setupRabbitMQ();

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

      // Prepare queue message
      const queueMessage = {
        id: orderId,
        items: req.body.items
      };
      
      // Try to publish with infinite retries
      await publishToQueue(rabbitChannel, queueMessage);
      res.status(201).json(savedOrder);
    } catch (err) {
      console.error('Error creating order:', err);

      // If order was saved but publishing failed
      if (err.message.includes('publish') && savedOrder) {
        res.status(201).json({
          ...savedOrder.toJSON(),
          warning: 'Order saved but queuing for processing failed. Will retry automatically.'
        });
      } else {
        res.status(500).json({ error: 'Failed to create order' });
      }
    }
  });

  // Endpoint for fetching all orders from MongoDB
  app.get('/bulkorders', async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      if(!orders || orders.length === 0) return res.status(404).json({ error: 'No orders found' });
      res.json(orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.listen(3000, () => console.log('Order API running on port 3000'));
}

start().catch(console.error);