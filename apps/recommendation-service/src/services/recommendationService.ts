import * as tf from "@tensorflow/tfjs-node";
import { getUserActivity } from "./fetch-user-activity";
import { preprocessData } from "../utils/preProcessData";

// Size of the embedding vector (feature dimension)
const EMBEDDING_DIM = 50;

// User actions that we track for recommendations
interface UserAction {
  userId: string;
  productId: string;
  actionType: "product_view" | "add_to_cart" | "add_to_wishlist" | "purchase";
}

// Interaction is a simplified version of UserAction used for training
interface Interaction {
  userId: string;
  productId: string;
  actionType: UserAction["actionType"];
}

// Final output after prediction
interface RecommendedProduct {
  productId: string;
  score: number;
}

// Fetch and normalize user actions
async function fetchUserActivity(userId: string): Promise<UserAction[]> {
  const userActions = await getUserActivity(userId);
  return Array.isArray(userActions)
    ? (userActions as unknown as UserAction[])
    : [];
}

export const recommendProducts = async (
  userId: string,
  allProducts: any
): Promise<string[]> => {
  // Fetch user behavior history (views, clicks, purchases, etc.)
  const userActions: UserAction[] = await fetchUserActivity(userId);
  if (userActions.length === 0) return [];

  // Format the data to extract interactions relevant to products
  const processedData = preprocessData(userActions, allProducts);
  if (!processedData || !processedData.interactions || !processedData.products)
    return [];

  const { interactions } = processedData as {
    interactions: Interaction[];
  };

  // Create mapping of user and product IDs to numeric indices for tensor conversion
  const userMap: Record<string, number> = {};
  const productMap: Record<string, number> = {};
  let userCount = 0;
  let productCount = 0;

  interactions.forEach(({ userId, productId }) => {
    if (!(userId in userMap)) userMap[userId] = userCount++;
    if (!(productId in productMap)) productMap[productId] = productCount++;
  });

  // Define model input layers
  const userInput = tf.input({
    shape: [1],
    dtype: "int32",
  }) as tf.SymbolicTensor;
  const productInput = tf.input({
    shape: [1],
    dtype: "int32",
  }) as tf.SymbolicTensor;

  // Create embedding layers (like lookup tables) to learn relationships
  const userEmbedding = tf.layers
    .embedding({ inputDim: userCount, outputDim: EMBEDDING_DIM })
    .apply(userInput) as tf.SymbolicTensor;

  const productEmbedding = tf.layers
    .embedding({ inputDim: productCount, outputDim: EMBEDDING_DIM })
    .apply(productInput) as tf.SymbolicTensor;

  // Flatten the 2D embeddings into 1D feature vectors
  const userVector = tf.layers
    .flatten()
    .apply(userEmbedding) as tf.SymbolicTensor;
  const productVector = tf.layers
    .flatten()
    .apply(productEmbedding) as tf.SymbolicTensor;

  // Dot product combines user and product vectors (user-product affinity)
  const merged = tf.layers
    .dot({ axes: 1 })
    .apply([userVector, productVector]) as tf.SymbolicTensor;

  // Final layer: outputs probability of interaction (e.g., purchase)
  const output = tf.layers
    .dense({ units: 1, activation: "sigmoid" })
    .apply(merged) as tf.SymbolicTensor;

  // Compile the recommendation model
  const model = tf.model({
    inputs: [userInput, productInput],
    outputs: output,
  });

  model.compile({
    optimizer: tf.train.adam(),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  // Convert user and product interactions into tensors for training
  const userTensor = tf.tensor1d(
    interactions.map((d) => userMap[d.userId] ?? 0),
    "int32"
  );

  const productTensor = tf.tensor1d(
    interactions.map((d) => productMap[d.productId] ?? 0),
    "int32"
  );

  // Assign different scores based on the action type (purchase > add_to_cart > ...)
  const weightedLabels = tf.tensor2d(
    interactions.map((d) => {
      switch (d.actionType) {
        case "purchase":
          return [1.0]; // most important
        case "add_to_cart":
          return [0.7];
        case "add_to_wishlist":
          return [0.5];
        case "product_view":
          return [0.1]; // least important
        default:
          return [0];
      }
    }),
    [interactions.length, 1]
  );

  // Train the model on user-product interactions
  await model.fit([userTensor, productTensor], weightedLabels, {
    epochs: 5,
    batchSize: 32,
  });

  // Predict scores for all products for the given user
  const productTensorAll = tf.tensor1d(Object.values(productMap), "int32");
  const predictions = model.predict([
    tf.tensor1d([userMap[userId] ?? 0], "int32"),
    productTensorAll,
  ]) as tf.Tensor;

  const scores = (await predictions.array()) as number[];

  // Sort and select top 10 recommended products based on score
  const recommendedProducts: RecommendedProduct[] = Object.keys(productMap)
    .map((productId, index) => ({
      productId,
      score: scores[index] ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Return only the product IDs of top recommended products
  return recommendedProducts.map((p) => p.productId);
};
