import express from "express";
import { 
    createOrder,
    getAllOrders
 } from "../controllers/orderController.js";

const router = express.Router();

// Define route for creating an order
router.route("/neworder").post(createOrder);
router.route("/getallorders/:userId").get(getAllOrders);


export default router;
