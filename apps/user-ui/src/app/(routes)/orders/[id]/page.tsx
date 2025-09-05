"use client";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import Image from "next/image";
import React, { useState } from "react";
import { format } from "date-fns";
import ReviewModal from "apps/user-ui/src/shared/components/modals/review.modal";

interface OrderItem {
  id: string;
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  deliveryStatus: string;
  createdAt: string;
}

export default function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleReviewClick = (productId: string, productTitle: string) => {
    setSelectedProduct({ id: productId, title: productTitle });
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    // Optionally refetch order data or show success message
    setReviewModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Order Details</h1>

      <button></button>
    </div>
  );
}
