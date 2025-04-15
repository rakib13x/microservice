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

| Service | Description |
|--------|-------------|
| `admin-service` | Backend service for admin operations |
| `admin-ui` | Frontend for managing admin dashboard |
| `api-gateway` | API layer that connects all backend microservices |
| `auth-service` | Handles login, register, token refresh, etc. |
| `auth-service-e2e` | End-to-end test suite for `auth-service` |
| `chatting-service` | Real-time chat service between buyers and sellers |
| `kafka-service` | Kafka setup for event-driven messaging |
| `logger-service` | Captures logs/events across all services |
| `order-service` | Manages orders, statuses, shipping, etc. |
| `product-service` | Handles products, categories, filtering |
| `recommendation-service` | AI-based product recommendations |
| `seller-service` | Seller profile, store data, and control center |
| `seller-ui` | Seller dashboard interface |
| `user-service` | Core business logic for user actions |
| `user-ui` | Main user-facing frontend |

---

## 🚀 Getting Started (Run Locally)

### 1. Clone the Repository

```bash
git clone https://github.com/becodemy/eshop.git
cd eshop
```

### 2. Install All Dependencies

```bash
npm install
```

---

## 🔐 Environment Variables Setup

### 3. Create `.env` File in Root

Copy values from `.env.example`, then update your secrets.

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

### ✅ Summary

Your final `.env` should look like this:

```env
DATABASE_URL="mongodb+srv://..."
REDIS_DATABASE_URI="https://..."
SMTP_USER="you@gmail.com"
SMTP_PASS="your_app_password"
SMTP_PORT=465
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com

ACCESS_TOKEN_SECRET="your_random_key"
REFRESH_TOKEN_SECRET="your_random_key"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_SECRET_KEY="private_..."

KAFKA_API_KEY="abc123"
KAFKA_API_SECRET="secret123"
```

---

### 4. Setup Frontend `.env` Files

#### ➤ `user-ui/.env`

```env
NEXT_PUBLIC_SERVER_URI=http://localhost:8080
NEXT_PUBLIC_SELLER_SERVER_URI=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXXXXXX
```

#### ➤ `seller-ui/.env`

```env
NEXT_PUBLIC_SERVER_URI=http://localhost:8080
NEXT_PUBLIC_USER_UI_LINK=http://localhost:3000
```

#### ➤ `admin-ui/.env`

```env
NEXT_PUBLIC_SERVER_URI=http://localhost:8080
NEXT_PUBLIC_USER_UI_LINK=http://localhost:3000
NEXT_PUBLIC_SOCKET_URI=ws://localhost:6004
```

---

## 🏁 Running the App

### Backend Microservices

```bash
npm run dev
```

This will spin up all backend services using [concurrently](https://www.npmjs.com/package/concurrently).

---

### Frontend Apps

In separate terminals, run:

```bash
npm run user-ui      # 👤 Starts User UI (http://localhost:3000)
npm run seller-ui    # 🛍️ Starts Seller Dashboard (http://localhost:3001)
npm run admin-ui     # 🧑‍💼 Starts Admin Panel (http://localhost:3002)
```

---

## 📡 Kafka Setup (Confluent)

1. Go to https://confluent.cloud  
2. Create a Kafka Cluster (Free tier works)  
3. Create **2 topics**:
   - `user-events`
   - `logs`
4. Grab your **API key + secret**, paste them into `.env`

---

## 💳 Stripe Setup

1. Go to https://dashboard.stripe.com  
2. Create a test product + price ID  
3. Enable `checkout.session.completed` webhook  
4. Paste your Stripe secret + webhook secret into `.env`

---

## 🧠 AI-Powered Features

This app supports:

- ✅ AI Product Recommendations (via TensorFlow)
- ✅ Real-time Log Streaming (Kafka + WebSocket)
- ✅ Seller + User Analytics Dashboard

---

## 📞 Support

If you need help with this project, please contact us through the official channel or our [Becodemy App](https://play.google.com/store/apps/details?id=com.becodemyofficial.app&pli=1).


> 🔒 Licensed to individual buyer only. All rights reserved © Becodemy Private Ltd.