import prisma from "@packages/libs/prisma";

export const updateUserAnalytics = async (event: any) => {
  try {
    // Fetch existing user analytics
    const existingData = await prisma.userAnalytics.findUnique({
      where: { userId: event.userId },
      select: { actions: true }, // Fetch only the actions array
    });

    let updatedActions: any = existingData?.actions || [];

    // Check if the exact `productId` + `action` already exists
    const actionExists = updatedActions.some(
      (entry: any) =>
        entry.productId === event.productId && entry.action === event.action
    );

    // Always store `product_view` for recommendations
    if (event.action === "product_view") {
      updatedActions.push({
        productId: event.productId,
        shopId: event.shopId,
        action: "product_view",
        timestamp: new Date(),
      });
    }

    // Store `add_to_cart` & `add_to_wishlist` only if they don’t already exist
    else if (
      ["add_to_cart", "add_to_wishlist"].includes(event.action) &&
      !actionExists
    ) {
      updatedActions.push({
        productId: event.productId,
        shopId: event.shopId,
        action: event.action,
        timestamp: new Date(),
      });
    }

    // Remove `add_to_cart` when `remove_from_cart` is triggered
    else if (event.action === "remove_from_cart") {
      updatedActions = updatedActions.filter(
        (entry: any) =>
          !(
            entry.productId === event.productId &&
            entry.action === "add_to_cart"
          )
      );
    }

    // Remove `add_to_wishlist` when `remove_from_wishlist` is triggered
    else if (event.action === "remove_from_wishlist") {
      updatedActions = updatedActions.filter(
        (entry: any) =>
          !(
            entry.productId === event.productId &&
            entry.action === "add_to_wishlist"
          )
      );
    }

    // Keep only the last 100 actions (prevent storage overload)
    if (updatedActions.length > 100) {
      updatedActions.shift();
    }

    const extraFields: Record<string, any> = {};

    if (event.country) {
      extraFields.country = event.country;
    }

    if (event.city) {
      extraFields.city = event.city;
    }

    if (event.device) {
      extraFields.device = event.device;
    }

    // Update or create user analytics
    await prisma.userAnalytics.upsert({
      where: { userId: event.userId },
      update: {
        lastVisited: new Date(),
        actions: updatedActions,
        ...extraFields,
      },
      create: {
        userId: event.userId,
        lastVisited: new Date(),
        actions: updatedActions,
        ...extraFields,
      },
    });

    // Also update Product Analytics
    await updateProductAnalytics(event);
  } catch (error) {
    console.log("Error storing user analytics:", error);
  }
};

export const updateProductAnalytics = async (event: any) => {
  try {
    if (!event.productId) return;

    // Define update fields dynamically
    const updateFields: any = {};

    if (event.action === "product_view") updateFields.views = { increment: 1 };
    if (event.action === "click") updateFields.clicks = { increment: 1 };
    if (event.action === "add_to_cart")
      updateFields.cartAdds = { increment: 1 };
    if (event.action === "remove_from_cart")
      updateFields.cartAdds = { decrement: 1 };
    if (event.action === "add_to_wishlist")
      updateFields.wishListAdds = { increment: 1 };
    if (event.action === "remove_from_wishlist")
      updateFields.wishListAdds = { decrement: 1 };
    if (event.action === "purchase") updateFields.purchases = { increment: 1 };

    // Update or create Product Analytics asynchronously
    await prisma.productAnalytics.upsert({
      where: { productId: event.productId },
      update: {
        lastViewedAt: new Date(),
        ...updateFields, // Apply the correct increment field
      },
      create: {
        productId: event.productId,
        shopId: event.shopId || null,
        views: event.action === "product_view" ? 1 : 0,
        cartAdds: event.action === "add_to_cart" ? 1 : 0,
        wishListAdds: event.action === "add_to_wishlist" ? 1 : 0,
        purchases: event.action === "purchase" ? 1 : 0,
        lastViewedAt: new Date(),
      },
    });
  } catch (error) {
    console.log("Error updating product analytics:", error);
  }
};
