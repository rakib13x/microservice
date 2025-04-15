import SellerProfile from "apps/user-ui/src/shared/modules/seller/seller-profile";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import type { Metadata } from "next";
import React from "react";

async function fetchSellerDetails(id: string) {
  const response = await axiosInstance.get(`/seller/api/get-seller/${id}`);
  return response.data;
}

// Dynamic Metadata Generator
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const data = await fetchSellerDetails(params.id);
  return {
    title: `${data?.shop?.name} | Eshop Marketplace`,
    description:
      data?.shop?.bio ||
      "Explore products and services from trusted sellers on Eshop.",
    openGraph: {
      title: `${data?.shop?.name} | Eshop Marketplace`,
      description:
        data?.shop?.bio ||
        "Explore products and services from trusted sellers on Eshop.",
      type: "website",
      images: [
        {
          url: data?.shop?.avatar || "/default-shop.png",
          width: 800,
          height: 600,
          alt: data?.shop.name || "Shop Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data?.shop?.name} | Eshop Marketplace`,
      description:
        data?.shop?.bio ||
        "Explore products and services from trusted sellers on Eshop.",
      images: [data?.shop?.avatar || "/default-shop.png"],
    },
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const data = await fetchSellerDetails(params.id);
  return (
    <div>
      <SellerProfile shop={data?.shop} followersCount={data?.followersCount} />
    </div>
  );
}
