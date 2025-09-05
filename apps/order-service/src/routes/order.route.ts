import isAuthenticated from "@packages/middleware/isAuthenticated";
import express, { Router } from "express";
import {
  createOrder,
  createPaymentIntent,
  createPaymentSession,
  getAdminOrders,
  getOrderDetails,
  getSellerOrders,
  getUserOrders,
  updateDeliveryStatus,
  verifyCouponCode,
  verifyingPaymentSession,
} from "../controllers/order.controller";
import { isAdmin, isSeller } from "@packages/middleware/authorizeRoles";
import redis from "@packages/libs/redis"; // Make sure to import redis
import bodyParser from "body-parser";

const router: Router = express.Router();
// Existing routes
router.post("/create-payment-intent", isAuthenticated, createPaymentIntent);
router.post("/create-payment-session", isAuthenticated, createPaymentSession);
router.get(
  "/verifying-payment-session",
  isAuthenticated,
  verifyingPaymentSession,
);
router.get("/get-seller-orders", isAuthenticated, isSeller, getSellerOrders);
router.get("/get-order-details/:id", isAuthenticated, getOrderDetails);
router.put(
  "/update-status/:orderId",
  isAuthenticated,
  isSeller,
  updateDeliveryStatus
);
router.put("/verify-coupon", isAuthenticated, verifyCouponCode);
router.get("/get-user-orders", isAuthenticated, getUserOrders);
router.get("/get-admin-orders", isAuthenticated, isAdmin, getAdminOrders);

// DEBUG ROUTE - Add this temporarily to debug Redis sessions
router.get("/debug-sessions", async (req, res) => {
  try {
    const keys = await redis.keys("payment-session:*");
    const sessions = [];

    for (const key of keys) {
      const data = await redis.get(key);
      const ttl = await redis.ttl(key);
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          sessions.push({
            key,
            ttl: ttl, // Time to live in seconds
            ttlMinutes: Math.round(ttl / 60), // Convert to minutes for readability
            userId: parsedData.userId,
            cartItems: parsedData.cart?.length || 0,
            totalAmount: parsedData.totalAmount,
            createdAgo: ttl < 0 ? "Never expires" : `${600 - ttl} seconds ago`,
            data: parsedData, // Full data for debugging
          });
        } catch (parseError) {
          sessions.push({
            key,
            ttl,
            error: "Failed to parse session data",
            rawData: data.substring(0, 100) + "...",
          });
        }
      }
    }

    res.json({
      message: "Redis Payment Sessions Debug Info",
      totalSessions: sessions.length,
      redisConnected: true,
      sessions: sessions.sort((a, b) => (b.ttl || 0) - (a.ttl || 0)), // Sort by TTL descending
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      redisConnected: false,
      message: "Failed to connect to Redis or fetch sessions"
    });
  }
});

// Additional debug route to check a specific session
router.get("/debug-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionKey = `payment-session:${sessionId}`;

    const data = await redis.get(sessionKey);
    const ttl = await redis.ttl(sessionKey);

    if (!data) {
      return res.json({
        found: false,
        sessionId,
        sessionKey,
        message: "Session not found or expired"
      });
    }

    const parsedData = JSON.parse(data);

    res.json({
      found: true,
      sessionId,
      sessionKey,
      ttl,
      ttlMinutes: Math.round(ttl / 60),
      data: parsedData
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      sessionId: req.params.sessionId
    });
  }
});

export default router;