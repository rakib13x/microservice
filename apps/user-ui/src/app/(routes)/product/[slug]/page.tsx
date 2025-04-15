import axiosInstance from "../../../../utils/axiosInstance";
import ProductDetails from "apps/user-ui/src/shared/modules/product/product-details";
import { Metadata } from "next";

async function fetchProductDetails(slug: string) {
  const response = await axiosInstance.get(`/product/api/get-product/${slug}`);
  return response.data.product;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await fetchProductDetails(params.slug);

  return {
    title: `${product?.title} | Becodemy Marketplace`,
    description:
      product?.short_description ||
      "Discover high-quality products on Becodemy Marketplace.",
    openGraph: {
      title: product?.title,
      description: product?.short_description || "",
      images: [product?.images?.[0]?.url || "/default-image.jpg"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product?.title,
      description: product?.short_description || "",
      images: [product?.images?.[0]?.url || "/default-image.jpg"],
    },
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const productDetails = await fetchProductDetails(params.slug);

  return <ProductDetails productDetails={productDetails} />;
}
