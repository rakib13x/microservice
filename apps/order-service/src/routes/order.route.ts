import isAuthenticated from "@packages/middleware/isAuthenticated";
import express, { Router } from "express";
import {
  createPaymentIntent,
  createPaymentSession,
  getAdminOrders,
  getOrderDetails,
  getSellerOrders,
  getUserOrders,
  updateDeliveryStatus,
  verifyCouponCode,
  verifyingPaymentSession,
} from "../controller/order.controller";
import { isAdmin, isSeller } from "@packages/middleware/authorizeRoles";

const router: Router = express.Router();

router.post("/create-payment-intent", isAuthenticated, createPaymentIntent);
router.post("/create-payment-session", isAuthenticated, createPaymentSession);
router.get(
  "/verifying-payment-session",
  isAuthenticated,
  verifyingPaymentSession
);
router.get("/get-user-orders", isAuthenticated, getUserOrders);
router.get("/get-order-details/:id", isAuthenticated, getOrderDetails);
router.get("/get-seller-orders", isAuthenticated, isSeller, getSellerOrders);
router.get("/get-admin-orders", isAuthenticated, isAdmin, getAdminOrders);
router.post("/verify-coupon", isAuthenticated, verifyCouponCode);
router.put("/update-status/:orderId", isAuthenticated, updateDeliveryStatus);

export default router;
