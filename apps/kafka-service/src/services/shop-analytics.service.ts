import prisma from "@packages/libs/prisma";
import { Prisma } from "@prisma/client";

export const updateShopAnalytics = async (event: any): Promise<any | null> => {
  try {
    const { shopId, userId, country, city, device } = event;
    if (!shopId || !userId) return null;

    const now = new Date();

    const extractDeviceType = (device: string): string => {
      if (!device) return "Unknown";
      const d = device.toLowerCase();
      if (d.includes("mobile")) return "Mobile";
      if (d.includes("tablet")) return "Tablet";
      if (d.includes("desktop")) return "Desktop";
      return "Other";
    };
    const deviceType = extractDeviceType(device);

    const toRecord = (
      json: Prisma.JsonValue | null
    ): Record<string, number> => {
      return typeof json === "object" && json !== null && !Array.isArray(json)
        ? (json as Record<string, number>)
        : {};
    };

    const incrementStat = (obj: Record<string, number>, key: string) => ({
      ...obj,
      [key]: (obj[key] || 0) + 1,
    });

    const existing = await prisma.shopAnalytics.findUnique({
      where: { id: shopId },
    });

    const existingVisitor = await prisma.uniqueShopVisitors.findUnique({
      where: {
        shopId_userId: {
          shopId,
          userId,
        },
      },
    });

    if (existing) {
      // Always increment totalVisitors
      const updateData: any = {
        totalVisitors: { increment: 1 },
        lastVisitedAt: now,
      };

      // Only increment stats if this is a new visitor
      if (!existingVisitor) {
        await prisma.uniqueShopVisitors.create({
          data: {
            shopId,
            userId,
          },
        });

        updateData.countryStats = incrementStat(
          toRecord(existing.countryStats),
          country
        );
        updateData.cityStats = incrementStat(
          toRecord(existing.cityStats),
          city
        );
        updateData.deviceStats = incrementStat(
          toRecord(existing.deviceStats),
          deviceType
        );
      }

      return await prisma.shopAnalytics.update({
        where: { id: shopId },
        data: updateData,
      });
    } else {
      // If it's a completely new shop analytics entry
      if (!existingVisitor) {
        await prisma.uniqueShopVisitors.create({
          data: {
            shopId,
            userId,
          },
        });
      }

      return await prisma.shopAnalytics.create({
        data: {
          id: shopId,
          totalVisitors: 1,
          countryStats: { [country]: 1 },
          cityStats: { [city]: 1 },
          deviceStats: { [deviceType]: 1 },
          lastVisitedAt: now,
        },
      });
    }
  } catch (error) {
    console.error("Failed to update shop analytics:", error);
    return null;
  }
};
