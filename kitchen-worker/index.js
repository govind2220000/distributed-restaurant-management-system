require('dotenv').config();
const amqp = require('amqplib');
const mongoose = require('mongoose');
const { delay, calculatePrepTime } = require('./utils');
const Order = require('./models/Order');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const MONGODB_URI = "mongodb://127.0.0.1:27017/restaurant_db";
const ORDER_QUEUE = 'orders';
const WORKER_COUNT = parseInt(process.env.WORKER_COUNT || '3');

async function connectDB() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI);
   
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function updateStatus(orderId, status, channel) {
  try {
    console.log(`Attempting to update order ${orderId} status to ${status}`);
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { 
        status,
        updatedAt: new Date()
      },
      { 
        new: true,
        upsert: true
      }
    );
    
    console.log(`Status updated for order ${orderId}: ${status}`);
    return updatedOrder;
  } catch (err) {
    console.error(`Error updating status for order ${orderId}:`, err);
    throw err;
  }
}

async function processOrder(order, channel, msg, retryCount = 0) {
  try {
    // Process the order
    await updateStatus(order.id, 'Preparing', channel);
    await delay(calculatePrepTime(order.items));
    
    await updateStatus(order.id, 'Ready for Pickup', channel);
    await delay(2000);
    
    await updateStatus(order.id, 'Completed', channel);
    
    // Only acknowledge after successful completion
    channel.ack(msg);
    console.log(`Successfully processed order ${order.id}`);
  } catch (err) {
    console.error(`Error processing order ${order.id}:`, err);
    
    // Calculate exponential backoff delay: 2^retryCount seconds i.e 1st retry: 2s, 2nd retry: 4s, 3rd retry: 8s
    const backoffDelay = Math.pow(2, retryCount + 1) * 1000;
    console.log(`Retrying order ${order.id} in ${backoffDelay/1000} seconds... (Attempt ${retryCount + 2})`);
    
    try {
      await Order.findOneAndUpdate(
        { orderId: order.id },
        { 
          status: 'In Queue',
          lastError: err.message,
          retryCount: retryCount + 1
        }
      );
    } catch (updateErr) {
      console.error('Error updating order status:', updateErr);
    }
    
    // Wait for backoff delay before retry
    await delay(backoffDelay);
    return processOrder(order, channel, msg, retryCount + 1);
  }
}

async function startWorker(workerId) {
  try {
    console.log(`[Worker ${workerId}] Initializing...`);
    
    const conn = await amqp.connect(RABBITMQ_URL);
    console.log(`[Worker ${workerId}] Connected to RabbitMQ`);
    
    const channel = await conn.createChannel();
    console.log(`[Worker ${workerId}] Channel created`);
    
    // Ensure queue is durable
    await channel.assertQueue(ORDER_QUEUE, { durable: true });
    console.log(`[Worker ${workerId}] Queue asserted`);
    
    await channel.prefetch(1);
    console.log(`[Worker ${workerId}] Prefetch set`);
    
    channel.consume(ORDER_QUEUE, (msg) => {
      console.log(`[Worker ${workerId}] Received message:`, msg.content.toString());
      const order = JSON.parse(msg.content.toString());
      processOrder(order, channel, msg);
    }, { noAck: false }); // Enable manual acknowledgment
    
    console.log(`[Worker ${workerId}] Started and ready for orders`);
    
    // Handle connection errors
    conn.on('error', (error) => {
      console.error(`[Worker ${workerId}] RabbitMQ connection error:`, error);
    });
    
    conn.on('close', () => {
      console.error(`[Worker ${workerId}] RabbitMQ connection closed. Attempting to reconnect...`);
      setTimeout(() => startWorker(workerId), 5000);
    });
    
    return true;
  } catch (error) {
    console.error(`[Worker ${workerId}] Failed to start:`, error);
    return false;
  }
}

async function init() {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Starting multiple workers sequentially
    console.log('Initializing kitchen workers...');
    
    for (let i = 1; i <= WORKER_COUNT; i++) {
      console.log(`\n=== Starting Worker ${i} ===`);
      const success = await startWorker(i);
      if (!success) {
        console.error(`Failed to initialize Worker ${i}`);
        process.exit(1);
      }
      // Added a small delay as in log workers were not starting in order
      await delay(500);
    }
    
    console.log(`\n All ${WORKER_COUNT} workers are running and ready for orders `);
  } catch (error) {
    console.error('Failed to initialize workers:', error);
    process.exit(1);
  }
}

init().catch(console.error);