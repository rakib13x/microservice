
import { NotFoundError, ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import redis from "@packages/libs/redis";
import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { sendEmail } from "../utils/send-email";
import { sendLog } from "@packages/utils/logs/send-logs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  //@ts-ignore
  apiVersion: "2025-02-24.acacia",
});

// create payment intent
export const createPaymentIntent = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const { amount, sessionId } = req.body;

  console.log("🔍 Creating payment intent:");
  console.log("- Amount:", amount);
  console.log("- Session ID:", sessionId);
  console.log("- User ID:", req.user.id);

  if (!sessionId) {
    console.log("❌ Missing session ID");
    return next(new ValidationError("Session ID is required"));
  }

  if (!amount || amount <= 0) {
    console.log("❌ Invalid amount:", amount);
    return next(new ValidationError("Valid amount is required"));
  }

  try {
    // Get session data from Redis to fetch seller info
    const sessionKey = `payment-session:${sessionId}`;
    console.log("🔍 Looking for session:", sessionKey);

    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      console.log("❌ Session not found in Redis");
      return next(new ValidationError("Payment session not found or expired"));
    }

    const session = JSON.parse(sessionData);
    console.log("✅ Session found with sellers:", session.sellers?.length || 0);
    console.log("🔍 Full sellers data:", JSON.stringify(session.sellers, null, 2));

    const primarySeller = session.sellers?.[0];
    console.log("🔍 Primary seller:", JSON.stringify(primarySeller, null, 2));

    const customerAmount = Math.round(amount * 100);
    console.log("💰 Customer amount (cents):", customerAmount);

    // Check if seller has valid Stripe account
    if (primarySeller?.stripeAccountId && primarySeller.stripeAccountId !== null) {
      // Use marketplace payment with platform fee
      const platformFee = Math.floor(customerAmount * 0.1);

      console.log("✅ Creating marketplace payment:");
      console.log("- Customer amount:", customerAmount);
      console.log("- Platform fee:", platformFee);
      console.log("- Seller gets:", customerAmount - platformFee);
      console.log("- Seller Stripe account:", primarySeller.stripeAccountId);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: customerAmount,
        currency: "usd",
        payment_method_types: ["card"],
        application_fee_amount: platformFee,
        transfer_data: {
          destination: primarySeller.stripeAccountId,
        },
        metadata: {
          sessionId,
          userId: req.user.id,
          paymentType: "marketplace",
        },
      });

      console.log("✅ Marketplace payment intent created:", paymentIntent.id);
      return res.send({
        clientSecret: paymentIntent.client_secret,
      });

    } else {
      // FALLBACK: Direct payment without marketplace features
      console.log("⚠️ No valid Stripe account found, creating direct payment");
      console.log("- Customer amount:", customerAmount);
      console.log("- No platform fee (direct payment)");
      console.log("- Seller stripeAccountId:", primarySeller?.stripeAccountId || 'undefined');

      const paymentIntent = await stripe.paymentIntents.create({
        amount: customerAmount,
        currency: "usd",
        payment_method_types: ["card"],
        // No application_fee_amount or transfer_data for direct payments
        metadata: {
          sessionId,
          userId: req.user.id,
          paymentType: "direct",
        },
      });

      console.log("✅ Direct payment intent created:", paymentIntent.id);
      return res.send({
        clientSecret: paymentIntent.client_secret,
      });
    }

  } catch (error) {
    console.error("❌ Error creating payment intent:", error);
    if (error instanceof Error) {
      console.error("- Error message:", error.message);
      console.error("- Error stack:", error.stack);
    }
    next(error);
  }
};
// create payment session
export const createPaymentSession = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cart, selectedAddressId, coupon } = req.body;
    const userId = req.user.id;

    console.log("🔍 Creating payment session:");
    console.log("- User ID:", userId);
    console.log("- Cart items:", cart?.length || 0);
    console.log("- Selected address:", selectedAddressId);
    console.log("- Coupon:", !!coupon);

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      console.log("❌ Cart validation failed");
      return next(new ValidationError("Cart is empty or invalid."));
    }

    const normalizedCart = JSON.stringify(
      cart
        .map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          sale_price: item.sale_price,
          shopId: item.shopId,
          selectedOptions: item.selectedOptions || {},
        }))
        .sort((a, b) => a.id.localeCompare(b.id)) // Fixed the typo here
    );

    console.log("✅ Cart normalized");

    // Check for existing sessions
    const keys = await redis.keys("payment-session:*");
    console.log("🔍 Found existing session keys:", keys.length);

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        if (session.userId === userId) {
          console.log("🔍 Found existing session for user:", key);

          const existingCart = JSON.stringify(
            session.cart
              .map((item: any) => ({
                id: item.id,
                quantity: item.quantity,
                sale_price: item.sale_price,
                shopId: item.shopId,
                selectedOptions: item.selectedOptions || {},
              }))
              .sort((a: any, b: any) => a.id.localeCompare(b.id))
          );

          if (existingCart === normalizedCart) {
            console.log("✅ Returning existing session:", key.split(":")[1]);
            return res.status(200).json({ sessionId: key.split(":")[1] });
          } else {
            console.log("🗑️ Deleting outdated session:", key);
            await redis.del(key);
          }
        }
      }
    }

    // Fetch sellers and their stripe accounts
    const uniqueShopIds = [...new Set(cart.map((item: any) => item.shopId))];
    console.log("🔍 Unique shop IDs:", uniqueShopIds);

    const shops = await prisma.shops.findMany({
      where: {
        id: { in: uniqueShopIds },
      },
      select: {
        id: true,
        sellerId: true,
        sellers: {
          select: {
            stripeId: true,
          },
        },
      },
    });

    console.log("✅ Found shops:", shops.length);

    const sellerData = shops.map((shop) => ({
      shopId: shop.id,
      sellerId: shop.sellerId,
      stripeAccountId: shop?.sellers?.stripeId, // Fixed typo: was stripeAccountOd
    }));

    // Calculate total
    const totalAmount = cart.reduce((total: number, item: any) => {
      return total + item.quantity * item.sale_price;
    }, 0);

    console.log("💰 Total amount:", totalAmount);

    // Create session payload
    const sessionId = crypto.randomUUID();
    console.log("🆔 Generated session ID:", sessionId);

    const sessionData = {
      userId,
      cart,
      sellers: sellerData,
      totalAmount,
      shippingAddressId: selectedAddressId || null,
      coupon: coupon || null,
    };

    const sessionKey = `payment-session:${sessionId}`;
    console.log("🔑 Session key:", sessionKey);

    // Store in Redis with debugging
    try {
      const result = await redis.setex(
        sessionKey,
        600, // 10 minutes
        JSON.stringify(sessionData)
      );
      console.log("✅ Redis setex result:", result);

      // Immediately verify it was stored
      const verification = await redis.get(sessionKey);
      const ttl = await redis.ttl(sessionKey);

      console.log("🔍 Verification:");
      console.log("- Data stored:", !!verification);
      console.log("- TTL:", ttl, "seconds");

      if (verification) {
        console.log("- Data length:", verification.length);
        console.log("- Data preview:", verification.substring(0, 100) + "...");
      } else {
        console.error("❌ Failed to store session in Redis!");
        return res.status(500).json({ error: "Failed to create payment session" });
      }

    } catch (redisError) {
      console.error("❌ Redis error:", redisError);
      throw redisError;
    }

    console.log("✅ Payment session created successfully");
    return res.status(201).json({ sessionId });

  } catch (error) {
    console.error("❌ Error in createPaymentSession:", error);
    next(error);
  }
};
// verifying payment session
export const verifyingPaymentSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required." });
    }

    // Fetch session from Redis
    const sessionKey = `payment-session:${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      return res.status(404).json({ error: "Session not found or expired." });
    }

    // Parse and return session
    const session = JSON.parse(sessionData);

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    return next(error);
  }
};

// create order
// Enhanced createOrder function with better debugging
// Add this to the very beginning of your createOrder function
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("🔔 WEBHOOK RECEIVED!");
  console.log("📝 Headers:", JSON.stringify(req.headers, null, 2));
  console.log("🔧 Method:", req.method);
  console.log("🌐 URL:", req.url);

  try {
    const stripeSignature = req.headers["stripe-signature"];
    console.log("🔐 Stripe signature present:", !!stripeSignature);

    if (!stripeSignature) {
      console.log("❌ Missing Stripe signature");
      return res.status(400).send("Missing Stripe signature");
    }

    const rawBody = (req as any).rawBody;
    console.log("📄 Raw body present:", !!rawBody);
    console.log("📄 Raw body length:", rawBody?.length || 0);

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        stripeSignature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log("✅ Webhook signature verified successfully");
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("🎯 Event type:", event.type);
    console.log("🆔 Event ID:", event.id);
    console.log("📊 Event data preview:", JSON.stringify(event.data, null, 2).substring(0, 500) + "...");

    if (event.type === "payment_intent.succeeded") {
      console.log("💳 Processing payment_intent.succeeded");

      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const sessionId = paymentIntent.metadata.sessionId;
      const userId = paymentIntent.metadata.userId;

      console.log("🔍 Payment Intent metadata:");
      console.log("- Session ID:", sessionId);
      console.log("- User ID:", userId);
      console.log("- Amount:", paymentIntent.amount);
      console.log("- Status:", paymentIntent.status);
      console.log("- Payment method:", paymentIntent.payment_method);

      if (!sessionId || !userId) {
        console.error("❌ Missing metadata in payment intent");
        console.log("Available metadata:", paymentIntent.metadata);
        return res.status(400).send("Missing required metadata");
      }

      const sessionKey = `payment-session:${sessionId}`;
      console.log("🔍 Looking for session:", sessionKey);

      const sessionData = await redis.get(sessionKey);
      console.log("📦 Session found:", !!sessionData);

      if (!sessionData) {
        console.log("❌ Session not found - checking all sessions");

        const keys = await redis.keys("payment-session:*");
        console.log("🔍 Available sessions:", keys);

        for (const key of keys) {
          const data = await redis.get(key);
          if (data) {
            const session = JSON.parse(data);
            console.log(`📋 Session ${key}:`);
            console.log(`- User ID: ${session.userId}`);
            console.log(`- Cart items: ${session.cart?.length || 0}`);
            console.log(`- Total: ${session.totalAmount}`);
          }
        }

        return res.status(200).send("No session found, skipping order creation");
      }

      console.log("📦 Session data length:", sessionData.length);

      let parsedSession;
      try {
        parsedSession = JSON.parse(sessionData);
        console.log("✅ Session parsed successfully");
        console.log("- User ID:", parsedSession.userId);
        console.log("- Cart items:", parsedSession.cart?.length || 0);
        console.log("- Total amount:", parsedSession.totalAmount);
      } catch (parseError) {
        console.error("❌ Failed to parse session:", parseError);
        return res.status(500).send("Invalid session data");
      }

      const { cart, totalAmount, shippingAddressId, coupon } = parsedSession;

      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        console.error("❌ Invalid cart in session");
        return res.status(400).send("Invalid cart data");
      }

      console.log("👤 Looking up user:", userId);
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user) {
        console.error("❌ User not found:", userId);
        return res.status(400).send("User not found");
      }

      console.log("✅ User found:", user.name, user.email);

      // Group by shop
      const shopGrouped = cart.reduce((acc: any, item: any) => {
        if (!acc[item.shopId]) acc[item.shopId] = [];
        acc[item.shopId].push(item);
        return acc;
      }, {});

      console.log("🏪 Shop groups:", Object.keys(shopGrouped));

      for (const shopId in shopGrouped) {
        console.log(`🔄 Creating order for shop: ${shopId}`);
        const orderItems = shopGrouped[shopId];

        let orderTotal = orderItems.reduce(
          (sum: number, p: any) => sum + p.quantity * p.sale_price,
          0
        );

        console.log(`💰 Order total: $${orderTotal}`);

        try {
          const orderData = {
            userId,
            shopId,
            total: orderTotal,
            status: "Paid",
            shippingAddressId: shippingAddressId || null,
            couponCode: coupon?.code || null,
            discountAmount: coupon?.discountAmount || 0,
            items: {
              create: orderItems.map((item: any) => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.sale_price,
                selectedOptions: item.selectedOptions,
              })),
            },
          };

          console.log("📝 Creating order with data:", JSON.stringify(orderData, null, 2));

          const order = await prisma.orders.create({
            data: orderData,
          });

          console.log("✅ Order created successfully!");
          console.log("- Order ID:", order.id);
          console.log("- Total:", order.total);
          console.log("- Status:", order.status);

        } catch (dbError) {
          console.error("❌ Database error creating order:", dbError);
          if (dbError instanceof Error) {
            console.error("- Error name:", dbError.name);
            console.error("- Error message:", dbError.message);
          }
          throw dbError;
        }
      }

      // Clean up session
      await redis.del(sessionKey);
      console.log("🧹 Session cleaned up");

    } else {
      console.log("ℹ️ Ignoring event type:", event.type);
    }

    console.log("✅ Webhook processed successfully");
    res.status(200).json({ received: true });

  } catch (error) {
    console.error("💥 Webhook error:", error);
    if (error instanceof Error) {
      console.error("- Error name:", error.name);
      console.error("- Error message:", error.message);
      console.error("- Error stack:", error.stack);
    }
    return next(error);
  }
};
// get sellers orders
export const getSellerOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const shop = await prisma.shops.findUnique({
      where: {
        sellerId: req.seller.id,
      },
    });

    // fetch all orders for this shop
    const orders = await prisma.orders.findMany({
      where: {
        shopId: shop?.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(201).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// get order details
export const getOrderDetails = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.id;

    const order = await prisma.orders.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
            selectedOptions: true,
          }
        },
      },
    });

    if (!order) {
      return next(new NotFoundError("Order not found with the id!"));
    }

    // Fetch product details for all items in one query
    const productIds = order.items.map(item => item.productId);
    const products = await prisma.products.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        id: true,
        title: true,
        images: {
          select: {
            url: true
          },
          take: 1
        }
      }
    });

    // Create a map of products for easy lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // Combine order items with their product details
    const itemsWithProducts = order.items.map(item => ({
      ...item,
      selectedOptions: item.selectedOptions,
      product: {
        title: productMap.get(item.productId)?.title || "Product not found",
        image: productMap.get(item.productId)?.images[0]?.url || null
      }
    }));

    const shippingAddress = order.shippingAddressId
      ? await prisma.address.findUnique({
        where: {
          id: order.shippingAddressId,
        },
      })
      : null;

    const coupon = order.couponCode
      ? await prisma.discount_codes.findUnique({
        where: {
          discountCode: order.couponCode,
        },
      })
      : null;

    res.status(200).json({
      success: true,
      order: {
        ...order,
        items: itemsWithProducts,
        shippingAddress,
        couponCode: coupon,
      },
    });
  } catch (error) {
    next(error);
  }
};

// update order status
export const updateDeliveryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    if (!orderId || !deliveryStatus) {
      return res
        .status(400)
        .json({ error: "Missing order ID or delivery status." });
    }

    const allowedStatuses = [
      "Ordered",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ];
    if (!allowedStatuses.includes(deliveryStatus)) {
      return next(new ValidationError("Invalid delivery status."));
    }

    const existingOrder = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return next(new NotFoundError("Order not found!"));
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        deliveryStatus,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Delivery status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    return next(error);
  }
};

// verify coupon code
export const verifyCouponCode = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { couponCode, cart } = req.body;

    if (!couponCode || !cart || cart.length === 0) {
      return next(new ValidationError("Coupon code and cart are required!"));
    }

    // Fetch the discount code
    const discount = await prisma.discount_codes.findUnique({
      where: { discountCode: couponCode },
    });

    if (!discount) {
      return next(new ValidationError("Coupon code isn't valid!"));
    }

    // Find matching product that includes this discount code
    const matchingProduct = cart.find((item: any) =>
      item.discount_codes?.some((d: any) => d === discount.id)
    );

    if (!matchingProduct) {
      return res.status(200).json({
        valid: false,
        discount: 0,
        discountAmount: 0,
        message: "No matching product found in cart for this coupon",
      });
    }

    let discountAmount = 0;
    const price = matchingProduct.sale_price * matchingProduct.quantity;

    if (discount.discountType === "percentage") {
      discountAmount = (price * discount.discountValue) / 100;
    } else if (discount.discountType === "flat") {
      discountAmount = discount.discountValue;
    }

    // Prevent discount from being greater than total price
    discountAmount = Math.min(discountAmount, price);

    res.status(200).json({
      valid: true,
      discount: discount.discountValue,
      discountAmount: discountAmount.toFixed(2),
      discountedProductId: matchingProduct.id,
      discountType: discount.discountType,
      message: "Discount applied to 1 eligible product",
    });
  } catch (error) {
    next(error);
  }
};

// get user orders
export const getUserOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await prisma.orders.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(201).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(error);
  }
};

// get admin orders
export const getAdminOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    // Fetch all orders
    const orders = await prisma.orders.findMany({
      include: {
        user: true,
        shop: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};
