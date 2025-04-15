import isAuthenticated from "@packages/middleware/isAuthenticated";
import express, { Router } from "express";
import {
  addUserAddress,
  deleteUserAddress,
  getUserAddresses,
  getWebsiteLayout,
} from "../controller/user.controller";

const router: Router = express.Router();

router.get("/shipping-addresses", isAuthenticated, getUserAddresses);
router.post("/add-address", isAuthenticated, addUserAddress);
router.delete("/delete-address/:addressId", isAuthenticated, deleteUserAddress);
router.get("/get-layouts", getWebsiteLayout);

export default router;
