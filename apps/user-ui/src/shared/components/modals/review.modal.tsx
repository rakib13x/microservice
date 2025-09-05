"use client";
import { Dialog, Transition } from "@headlessui/react";
import { StarIcon, X, Upload } from "lucide-react";
import Image from "next/image";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import axiosInstance from "../../../utils/axiosInstance";
import { isProtected } from "../../../utils/protected";

interface Props {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onSuccess?: () => void;
  productId: string;
}

export default function ReviewModal({
  isOpen,
  setIsOpen,
  onSuccess,
  productId,
}: Props) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    if (!review.trim()) {
      toast.error("Please write a review");
      return;
    }

    try {
      setLoading(true);

      // Make the API call to submit the review
      await axiosInstance.post(
        `/product/api/product/${productId}/review`,
        {
          rating,
          review: review.trim(),
        },
        isProtected
      );

      toast.success("Review submitted successfully!");

      // Reset form
      setRating(5);
      setReview("");
      setHoveredRating(0);

      // Close modal
      setIsOpen(false);

      // Call success callback
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      const errorMessage =
        error?.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      // Reset form when closing
      setRating(5);
      setReview("");
      setHoveredRating(0);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "";
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-white"
                  >
                    Write a Review
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-300 disabled:opacity-50 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Rating
                    </label>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className={`transition-colors ${
                            (hoveredRating || rating) >= star
                              ? "text-yellow-400"
                              : "text-gray-400"
                          } hover:text-yellow-300`}
                        >
                          <StarIcon
                            size={24}
                            fill={
                              (hoveredRating || rating) >= star
                                ? "#facc15"
                                : "none"
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">
                      {getRatingText(hoveredRating || rating)}
                    </p>
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Your Review
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Share your experience with this product..."
                      className="w-full rounded-lg bg-gray-800 border border-gray-600 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      rows={4}
                      maxLength={500}
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {review.length}/500 characters
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !review.trim()}
                    className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Submit Review"
                    )}
                  </button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
