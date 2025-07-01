import express, { Router } from "express";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import { getRecommendedProducts } from "../controllers/recommendation-controller";

const router: Router = express.Router();

router.get(
  "/get-recommendation-products",
  isAuthenticated,
  getRecommendedProducts
);

export default router;
