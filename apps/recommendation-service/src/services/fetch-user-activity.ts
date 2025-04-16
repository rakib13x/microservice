import prisma from "@packages/libs/prisma";

export const getUserActivity = async (userId: string) => {
  const userAnalytics = await prisma.userAnalytics.findUnique({
    where: { userId },
    select: { actions: true },
  });

  return userAnalytics ? userAnalytics.actions : [];
};
