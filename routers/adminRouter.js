import express from "express";
import {
  adminSignup,
  adminLogin,
  getDashboardStats,
  getAllOrdersAdmin,
  updateOrderStatus,
  getAllCustomers,
  getCustomerDetails,
  toggleCustomerStatus,
  getProductStats
} from "../controllers/adminController.js";

//import { verifyAdminToken } from "../middlewares/adminAuth.js";

const router = express.Router();

// Authentication routes (no auth required)
router.post("/signup", adminSignup);
router.post("/login", adminLogin);

// Protected routes (require admin authentication)
//router.use(verifyAdminToken);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Order Management
router.get("/orders", getAllOrdersAdmin);
router.put("/orders/:orderId/status", updateOrderStatus);

// Customer Management  
router.get("/customers", getAllCustomers);
router.get("/customers/:customerId", getCustomerDetails);
router.put("/customers/:customerId/toggle-status", toggleCustomerStatus);

// Product Analytics
router.get("/products/stats", getProductStats);

export default router;