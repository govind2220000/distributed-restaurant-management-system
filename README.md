# Restaurant Order Management System

A microservices-based restaurant order management system built with Node.js, React, MongoDB, and RabbitMQ. The system handles order creation, kitchen processing, and real-time status updates.

## System Architecture

- **Frontend**: React application for placing orders and viewing order status
- **Order API**: REST API for handling order submissions and status queries
- **Kitchen Workers**: Background workers for processing orders
- **MongoDB**: Database for order storage
- **RabbitMQ**: Message queue for order processing

## Prerequisites

- Docker and Docker Compose
- Node.js 20.x (for local development)
- Git

## Quick Start with Docker Compose

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd restaurant-management-system
   ```

2. Start all services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

This will start:
- MongoDB at `localhost:27017`
- RabbitMQ at `localhost:5672` (Management UI at `localhost:15672`)
- Order API at `localhost:3000`
- Frontend at `localhost:5173`
- Kitchen Workers (3 instances by default)

## Service URLs

- **Frontend**: http://localhost:5173
- **Order API**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## API Endpoints

### Order API
- `POST /orders` - Create a new order
- `GET /bulkorders` - Get all orders with status

## Development Setup

If you want to run services individually for development:

1. Start MongoDB and RabbitMQ:
   ```bash
   docker-compose up mongodb rabbitmq
   ```

2. Start Order API:
   ```bash
   cd order-api
   npm install
   npm run dev
   ```

3. Start Kitchen Workers:
   ```bash
   cd kitchen-worker
   npm install
   npm run dev
   ```

4. Start Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Environment Variables

### Order API
- `MONGODB_URI`: MongoDB connection string
- `RABBITMQ_URL`: RabbitMQ connection string

### Kitchen Worker
- `MONGODB_URI`: MongoDB connection string
- `RABBITMQ_URL`: RabbitMQ connection string
- `WORKER_COUNT`: Number of concurrent workers (default: 3)

### Frontend
- `VITE_API_URL`: Order API URL

## Docker Commands

Start all services:
```bash
docker-compose up --build
```

Stop all services:
```bash
docker-compose down
```

Stop and remove volumes:
```bash
docker-compose down -v
```

View logs:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs [service-name]
```

## Troubleshooting

1. **MongoDB Connection Issues**
   - Ensure MongoDB container is running: `docker-compose ps`
   - Check MongoDB logs: `docker-compose logs mongodb`
   - Verify connection string in environment variables

2. **RabbitMQ Connection Issues**
   - Check RabbitMQ status in management UI
   - Verify RabbitMQ credentials
   - Check RabbitMQ logs: `docker-compose logs rabbitmq`

3. **Kitchen Worker Issues**
   - Check worker logs: `docker-compose logs kitchen-worker`
   - Verify worker count in environment variables
   - Check MongoDB and RabbitMQ connectivity

4. **Frontend Issues**
   - Verify API URL in environment variables
   - Check browser console for errors
   - Ensure Order API is accessible

## Project Structure

```
.
├── docker-compose.yml
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── order-api/
│   ├── models/
│   ├── package.json
│   └── Dockerfile
└── kitchen-worker/
    ├── models/
    ├── utils.js
    ├── package.json
    └── Dockerfile
```

