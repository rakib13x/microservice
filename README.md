# 🛒 Eshop – Multivendor eCommerce Platform (Microservices-Based)

> Built with ❤️ by **Becodemy**  
> A scalable, modern eCommerce SaaS with seller dashboard, real-time analytics, and microservice architecture.

---

## ⚠️ Legal Disclaimer

This source code is **licensed for individual use only**.

> 🚫 **Strictly Prohibited:**  
> Sharing, reselling, publishing to GitHub/public repos, or redistributing this codebase in any form is a **violation of licensing terms**.

We retain full rights under the **laws of the United Kingdom and Wales**. Legal actions will be taken in case of any misuse. We actively monitor license violations.

---

## 🧩 Project Structure – Services Breakdown

| Service                  | Description                                       | Port |
| ------------------------ | ------------------------------------------------- | ---- |
| `admin-service`          | Backend service for admin operations              | 6005 |
| `admin-ui`               | Frontend for managing admin dashboard             | 3002 |
| `api-gateway`            | API layer that connects all backend microservices | 8080 |
| `auth-service`           | Handles login, register, token refresh, etc.      | 6001 |
| `auth-service-e2e`       | End-to-end test suite for `auth-service`          | -    |
| `chatting-service`       | Real-time chat service between buyers and sellers | 6006 |
| `kafka-service`          | Kafka setup for event-driven messaging            | 6007 |
| `logger-service`         | Captures logs/events across all services          | 6008 |
| `order-service`          | Manages orders, statuses, shipping, etc.          | 6003 |
| `product-service`        | Handles products, categories, filtering           | 6002 |
| `recommendation-service` | AI-based product recommendations                  | 6009 |
| `seller-service`         | Seller profile, store data, and control center    | 6004 |
| `seller-ui`              | Seller dashboard interface                        | 3001 |
| `user-ui`                | Main user-facing frontend                         | 3000 |

---

## 🚀 Getting Started (Run Locally with Docker)

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Git** for cloning the repository

### 1. Clone the Repository

```bash
git clone https://github.com/becodemy/eshop.git
cd eshop
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

**Important:** Update the `.env` file with your actual credentials (see Environment Variables section below).

### 3. Build and Run with Docker

#### Option A: Run All Services (Recommended)

```bash
# Build all services
docker-compose build

# Start all services in detached mode
docker-compose up -d
```

#### Option B: Run Specific Services

```bash
# Run only backend services
docker-compose up -d auth-service product-service order-service api-gateway

# Run only UI services
docker-compose up -d user-ui seller-ui admin-ui
```

#### Option C: Development Mode (with logs)

```bash
# Run with real-time logs
docker-compose up
```

### 4. Access the Applications

Once all services are running:

| Application          | URL                   | Description                 |
| -------------------- | --------------------- | --------------------------- |
| **User Frontend**    | http://localhost:3000 | Main customer-facing app    |
| **Seller Dashboard** | http://localhost:3001 | Seller management interface |
| **Admin Panel**      | http://localhost:3002 | Admin control center        |
| **API Gateway**      | http://localhost:8080 | Backend API endpoint        |

### 5. Useful Docker Commands

```bash
# View running containers
docker-compose ps

# View logs for specific service
docker-compose logs -f auth-service

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose down && docker-compose build && docker-compose up -d

# Remove all containers and volumes
docker-compose down -v
```

---

## 🔐 Environment Variables Setup

### Required Environment Variables

Update your `.env` file with the following credentials:

## 🛠️ How to Get Your `.env` Values

This section walks you through how to obtain **each required environment variable** to run the project locally or in production.

---

### 🔹 `DATABASE_URL` – MongoDB Atlas

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and a new **project**.
3. Click **Build a Database** → Choose Free Tier.
4. Select a region and deploy your cluster.
5. Once ready, go to your cluster → **Connect** → **Drivers** → Copy the connection string.
6. Replace `<password>` with your MongoDB password and add your DB name.

Example:

```env
DATABASE_URL="mongodb+srv://your-username:your-password@cluster0.mongodb.net/eshop-db"
```

---

### 🔸 `REDIS_DATABASE_URI` – Upstash Redis

1. Go to [https://upstash.com](https://upstash.com)
2. Create an account and a **Redis** database.
3. Go to the **REST API** tab.
4. Copy the **Redis REST URL**.

Example:

```env
REDIS_DATABASE_URI="rediss://global-winter-xxxx.upstash.io"
```

---

### 📧 SMTP Config – Gmail (or any SMTP provider)

For sending emails using **Gmail SMTP**:

1. Go to [https://myaccount.google.com](https://myaccount.google.com)
2. Enable **2-step verification**.
3. Then go to **App Passwords** section.
4. Generate a password for "Mail".

Use these values:

```env
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_PORT=465
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
```

---

### 🔑 `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET`

Use any secure string. You can generate one using [https://generate-random.org](https://generate-random.org)

Example:

```env
ACCESS_TOKEN_SECRET="fj2#Z8Kp$1sn_9dVk12@@kKd7"
REFRESH_TOKEN_SECRET="7DJskf**4ss@Q29s2AakjWv"
```

---

### 💳 Stripe Keys – Payments

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Go to **Developers → API keys**
   - Copy your **Secret Key**
3. Go to **Webhooks** → Create a webhook endpoint
   - URL: `http://localhost:8080/order/webhook` (or your deployed backend)
   - Events: `checkout.session.completed`
   - Copy the generated **Webhook Signing Secret**

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_..."
```

---

### 🖼️ ImageKit Keys – Image CDN

1. Go to [https://imagekit.io/dashboard](https://imagekit.io/dashboard)
2. Create an account and a project.
3. Go to **Developer → API Keys**
   - Copy **Public API Key**
   - Copy **Private API Key**

```env
IMAGEKIT_PUBLIC_KEY="public_xyz..."
IMAGEKIT_SECRET_KEY="private_abc..."
```

---

### 📡 Kafka Keys – Confluent Cloud Setup

1. Go to [https://confluent.cloud](https://confluent.cloud)
2. Create an account and a **Kafka Cluster** (Basic Tier is free).
3. Go to your **Kafka Cluster → API Keys → Create Key**
   - Enable for **Global Access**
   - Copy the **Key** and **Secret**
4. Create 2 Kafka Topics:
   - `user-events`
   - `logs`

```env
KAFKA_API_KEY="V2UYZT...XYZ"
KAFKA_API_SECRET="0uTZP9...ASD"
```

---

### ✅ Complete .env Example

Your final `.env` should look like this:

```env
DATABASE_URL="mongodb+srv://..."
REDIS_DATABASE_URI="rediss://..."
SMTP_USER="you@gmail.com"
SMTP_PASS="your_app_password"
SMTP_PORT=465
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com

ACCESS_TOKEN_SECRET="your_random_key"
REFRESH_TOKEN_SECRET="your_random_key"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_..."

IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_SECRET_KEY="private_..."

KAFKA_API_KEY="abc123"
KAFKA_API_SECRET="secret123"
```

---

## 🏗️ Architecture Overview

### Microservices Architecture

- **API Gateway** (Port 8080) - Single entry point for all client requests
- **Backend Services** (Ports 6001-6009) - Independent microservices
- **Frontend Applications** (Ports 3000-3002) - React/Next.js applications
- **Cloud Infrastructure** - MongoDB Atlas, Upstash Redis, Confluent Kafka

### Docker Setup

- **Multi-stage builds** for optimized image sizes (~70MB per service)
- **Individual Dockerfiles** for each service enabling independent deployment
- **Resource limits** configured to prevent memory issues
- **Production-ready** with `docker-compose.prod.yml`

---

## 🔧 Development Setup (Alternative)

If you prefer running without Docker:

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Backend Services

```bash
npm run dev
```

### 3. Run Frontend Apps (in separate terminals)

```bash
npm run user-ui      # 👤 User UI (http://localhost:3000)
npm run seller-ui    # 🛍️ Seller Dashboard (http://localhost:3001)
npm run admin-ui     # 🧑‍💼 Admin Panel (http://localhost:3002)
```

---

## 🚀 Production Deployment

For production deployment:

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

**Recommended Platforms:**

- Railway
- Render
- AWS ECS Fargate
- Google Cloud Run
- DigitalOcean App Platform

---

## 🧠 AI-Powered Features

This app supports:

- ✅ AI Product Recommendations (via TensorFlow)
- ✅ Real-time Log Streaming (Kafka + WebSocket)
- ✅ Seller + User Analytics Dashboard
- ✅ Event-driven Architecture
- ✅ Microservices Communication

---

## 🛠️ Troubleshooting

### Common Issues

**Port conflicts:**

```bash
# Check what's running on ports
lsof -i :3000
lsof -i :8080
```

**Docker build issues:**

```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

**Environment variables not loading:**

- Ensure `.env` file is in the root directory
- Check for typos in variable names
- Restart Docker containers after `.env` changes

---

## 📞 Support

If you need help with this project, please contact us through the official channel or our [Becodemy App](https://play.google.com/store/apps/details?id=com.becodemyofficial.app&pli=1).

> 🔒 Licensed to individual buyer only. All rights reserved © Becodemy Private Ltd.

```

This updated README now provides:

1. **Docker-first approach** with clear setup instructions
2. **Port mapping table** for easy reference
3. **Multiple deployment options** (all services, specific services, development mode)
4. **Useful Docker commands** for daily development
5. **Architecture overview** explaining the microservices setup
6. **Production deployment** guidance
7. **Troubleshooting section** for common issues
8. **Preserved all existing content** while enhancing it with Docker instructions

The README now serves as a comprehensive guide for both Docker and traditional development setups!
```
