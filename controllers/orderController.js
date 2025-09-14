import Order from "../models/orderModel.js";
import {Cart,User} from "../models/userModel.js";

const createOrder = async (req, res) => {
  try {
    const { user, shippingAddress, paymentMethod } = req.body;

    // Validate required fields
    if (!user || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Fetch the user's cart with populated product details
    const cart = await Cart.findOne({ user }).populate({
      path: "cartItems.product",
      select: "name price images description" // Specify the fields you need
    });

    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Validate that all products are properly populated
    const invalidItems = cart.cartItems.filter(item => !item.product || !item.product.price);
    if (invalidItems.length > 0) {
      return res.status(400).json({ 
        message: "Some products in cart are invalid or no longer available",
        invalidItems: invalidItems.length
      });
    }

    // Calculate total price with additional validation
    const totalPrice = cart.cartItems.reduce((sum, item) => {
      if (item.product && item.product.price && item.quantity) {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);

    if (totalPrice <= 0) {
      return res.status(400).json({ message: "Invalid total price calculated" });
    }

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

// NEW FUNCTIONS FOR ANALYTICS
const getOrderAnalytics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get orders by time of day
    const ordersByTime = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $addFields: {
          hour: { $hour: "$createdAt" }
        }
      },
      {
        $addFields: {
          timeRange: {
            $switch: {
              branches: [
                { case: { $and: [{ $gte: ["$hour", 6] }, { $lt: ["$hour", 12] }] }, then: "Morning" },
                { case: { $and: [{ $gte: ["$hour", 12] }, { $lt: ["$hour", 18] }] }, then: "Afternoon" },
                { case: { $and: [{ $gte: ["$hour", 18] }, { $lt: ["$hour", 24] }] }, then: "Evening" },
                { case: { $and: [{ $gte: ["$hour", 0] }, { $lt: ["$hour", 6] }] }, then: "Night" }
              ],
              default: "Unknown"
            }
          }
        }
      },
      {
        $group: {
          _id: "$timeRange",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily orders for the last 6 days
    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Get total orders and comparison
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate }
    });

    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - days);

    const previousPeriodOrders = await Order.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd }
    });

    const percentageChange = previousPeriodOrders > 0 
      ? ((totalOrders - previousPeriodOrders) / previousPeriodOrders * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        ordersByTime,
        dailyOrders,
        totalOrders,
        percentageChange,
        period: days
      }
    });

  } catch (error) {
    console.error("Error fetching order analytics:", error);
    res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
};

// FIXED: Get sales summary data
const getSalesSummary = async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    // Get today's orders
    const todayOrders = await Order.find({
      createdAt: { $gte: startOfToday }
    });

    // Get yesterday's orders
    const yesterdayOrders = await Order.find({
      createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
    });

    // Calculate today's stats
    const todayTotalSales = todayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const todayTotalOrders = todayOrders.length;
    const todayProductsSold = todayOrders.reduce((sum, order) => {
      return sum + (order.orderItems || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
    }, 0);

    // Calculate yesterday's stats
    const yesterdayTotalSales = yesterdayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const yesterdayTotalOrders = yesterdayOrders.length;
    const yesterdayProductsSold = yesterdayOrders.reduce((sum, order) => {
      return sum + (order.orderItems || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
    }, 0);

    // Get new customers today (check if User model exists and has proper field)
    let todayNewCustomers = 0;
    let yesterdayNewCustomers = 0;

    try {
      todayNewCustomers = await User.countDocuments({
        createdAt: { $gte: startOfToday }
      });

      yesterdayNewCustomers = await User.countDocuments({
        createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
      });
    } catch (userError) {
      console.warn('User model issue:', userError.message);
      // If User model has issues, use order customers as fallback
      const todayCustomerIds = [...new Set(todayOrders.map(order => order.user))];
      const yesterdayCustomerIds = [...new Set(yesterdayOrders.map(order => order.user))];
      
      todayNewCustomers = todayCustomerIds.length;
      yesterdayNewCustomers = yesterdayCustomerIds.length;
    }

    // Calculate percentage changes
    const calculatePercentageChange = (today, yesterday) => {
      if (yesterday === 0) return today > 0 ? 100 : 0;
      return ((today - yesterday) / yesterday * 100).toFixed(1);
    };

    const salesChange = calculatePercentageChange(todayTotalSales, yesterdayTotalSales);
    const ordersChange = calculatePercentageChange(todayTotalOrders, yesterdayTotalOrders);
    const productsChange = calculatePercentageChange(todayProductsSold, yesterdayProductsSold);
    const customersChange = calculatePercentageChange(todayNewCustomers, yesterdayNewCustomers);

    res.status(200).json({
      success: true,
      data: {
        totalSales: {
          value: todayTotalSales,
          change: `${salesChange >= 0 ? '+' : ''}${salesChange}% from yesterday`
        },
        totalOrders: {
          value: todayTotalOrders,
          change: `${ordersChange >= 0 ? '+' : ''}${ordersChange}% from yesterday`
        },
        productsSold: {
          value: todayProductsSold,
          change: `${productsChange >= 0 ? '+' : ''}${productsChange}% from yesterday`
        },
        newCustomers: {
          value: todayNewCustomers,
          change: `${customersChange >= 0 ? '+' : ''}${customersChange}% from yesterday`
        }
      }
    });

  } catch (error) {
    console.error("Error fetching sales summary:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching sales summary", 
      error: error.message 
    });
  }
};

export {
    createOrder,
    getAllOrders,
    getOrderAnalytics,
    getSalesSummary
}