import express from "express";
import { 
    createOrder,
    getAllOrders,
    getOrderAnalytics,
     getSalesSummary 
 } from "../controllers/orderController.js";
import { Cart } from "../models/userModel.js"; // Add this import

const router = express.Router();

// Apply authentication middleware to all order routes
//router.use(verifyToken);//id this method is choosen then we must have the jwt token to proceed 

// Define route for creating an order
router.route("/neworder").post(createOrder);
router.route("/getallorders/:userId").get(getAllOrders);

// NEW ANALYTICS ROUTE
router.route("/analytics").get(getOrderAnalytics);

router.route("/sales-summary").get(getSalesSummary);
//this temporary debug route to your orderRouter.js for testing
router.get("/debug/cart/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId });
    console.log("Raw cart:", cart);
    
    const populatedCart = await Cart.findOne({ user: req.params.userId })
      .populate("cartItems.product");
    console.log("Populated cart:", populatedCart);
    
    res.json({ raw: cart, populated: populatedCart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//this is temp 
router.delete("/clear-cart/:userId", async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.params.userId });
    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;