import express from "express";
import { createOrder } from "../controllers/orderController.js";

const router = express.Router();

// Define route for creating an order
router.route("/neworder").post(createOrder);

export default router;
