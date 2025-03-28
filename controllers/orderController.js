import Order from "../models/orderModel.js";

import {Cart} from "../models/userModel.js";

const createOrder = async (req, res) => {
  try {
    const { user, shippingAddress, paymentMethod } = req.body;

    // Validate required fields
    if (!user || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Fetch the user's cart
    const cart = await Cart.findOne({ user }).populate("cartItems.product");

    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total price
    const totalPrice = cart.cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Create the order
    const newOrder = new Order({
      user,
      orderItems: cart.cartItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      shippingAddress,
      paymentMethod,
      totalPrice,
    });

    await newOrder.save();

    // Clear the user's cart
    await Cart.findOneAndDelete({ user });

    res.status(201).json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching orders for User ID:", userId);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch orders with product details
    const orders = await Order.find({ user: userId })
      .populate("orderItems.product", "name price images description") // Fetch product details
      .sort({ createdAt: -1 });

    console.log("Orders fetched:", orders);

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export {
    createOrder,
    getAllOrders
}