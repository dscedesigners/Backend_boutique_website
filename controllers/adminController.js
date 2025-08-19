import Admin from "../models/adminModel.js";
import Order from "../models/orderModel.js";
import { User } from "../models/userModel.js";
import Product from "../models/tailorModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Admin Authentication
export const adminSignup = async (req, res) => {
  try {
    //by default assinging the role of admin
    const { name, email, password, role = "admin" } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12); //hashing the password
    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await admin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating admin", error: error.message });
  }
};

//admin login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password); //decrypting the pass from the database
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    //creating the jwt token after successful login
    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
};

// Dashboard Analytics
export const getDashboardStats = async (req, res) => {
  try {
    //filtring the data from months wise
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Total Orders
    const totalOrders = await Order.countDocuments();
    const monthlyOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Order Status Breakdown
    //groups orders by their status
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalPrice" },
        },
      },
    ]);

    // Total Sales
    //includes pending, confirmed, shipped, delivered ne will not include
    const totalSales = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } }, //remove the cancelled orders
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }, //Sums up all totalPrice values from the orders
    ]);

    // Products Sold
    const productsSold = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$orderItems" }, //deconstructs an array field from the input documents and outputs a document for each element of the array.
      { $group: { _id: null, total: { $sum: "$orderItems.quantity" } } },
    ]);

    // New Customers (this month)
    const newCustomers = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Total Customers
    const totalCustomers = await User.countDocuments();

    // Top Products
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } }, //Filter Valid Orders
      { $unwind: "$orderItems" }, //Flatten Order Items
      {
        $group: {
          //Calculate Product Statistics
          _id: "$orderItems.product", // Group by product ID
          totalSold: { $sum: "$orderItems.quantity" }, // Total quantity sold
          revenue: {
            $sum: { $multiply: ["$orderItems.quantity", "$orderItems.price"] },
          }, // Total revenue
          // Groups all order items by product ID
          // Calculates total quantity sold for each product
          // Calculates total revenue (quantity × price) for each product
        },
      },
      {
        $lookup: {
          // Join Product Details
          from: "products", // Join with products collection
          localField: "_id", // Product ID from group stage
          foreignField: "_id", // Product ID in products collection
          as: "product", // Store joined data as "product" array
        },
//         Joins with the products collection to get product details
// Retrieves product name, images, etc
      },
      { $unwind: "$product" },
//       Converts the product array into a single object
// Makes product data directly accessible
      { $sort: { totalSold: -1 } }, //Order by Best Selling
//       Sorts products by total quantity sold in descending order
// Best-selling products appear first
      { $limit: 5 },
      // Returns only the top 5 best-selling products
      {
        $project: {
          productName: "$product.name",
          totalSold: 1,
          revenue: 1,
          productImage: { $arrayElemAt: ["$product.images", 0] },
        },
//         Selects and formats the final output fields
// Gets the first image from the images array
      },
    ]);

    res.json({
      totalOrders,
      monthlyOrders,
      totalSales: totalSales[0]?.total || 0,
      productsSold: productsSold[0]?.total || 0,
      newCustomers,
      totalCustomers,
      orderStats,
      topProducts,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching dashboard stats",
        error: error.message,
      });
  }
};

// Order Management
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
    } = req.query;

    let filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const orders = await Order.find(filter)
      .populate("user", "phone email createdAt")
      .populate("orderItems.product", "name images")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalOrders = await Order.countDocuments(filter);

    const formattedOrders = orders.map((order) => ({
      trackId: order._id,
      customer: order.user?.phone || order.user?.email || "N/A",
      date: order.createdAt,
      amount: order.totalPrice,
      paymentMode: order.paymentMethod,
      status: order.status,
      items: order.orderItems.length,
      products: order.orderItems.map((item) => ({
        name: item.product?.name,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    res.json({
      orders: formattedOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: parseInt(page),
      totalOrders,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order", error: error.message });
  }
};

// Customer Management
export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, customerType } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalCustomers = await User.countDocuments(filter);

    // Get order stats for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await Order.find({ user: customer._id });
        const totalOrders = orders.length;
        const totalSpent = orders
          .filter((order) => order.status !== "cancelled")
          .reduce((sum, order) => sum + order.totalPrice, 0);

        const lastOrder =
          orders.length > 0
            ? orders.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              )[0]
            : null;

        const cancelledOrders = orders.filter(
          (order) => order.status === "cancelled"
        ).length;

        return {
          customerId: customer._id,
          customerEmail: customer.email || "N/A",
          customerPhone: customer.phone,
          lastOrderDate: lastOrder?.createdAt || null,
          totalOrders,
          totalSpent,
          cancelledOrders,
          status: customer.isActive ? "Active" : "Blocked",
          signupDate: customer.createdAt,
          customerType: totalOrders > 1 ? "Returning" : "New",
        };
      })
    );

    res.json({
      customers: customersWithStats,
      totalPages: Math.ceil(totalCustomers / limit),
      currentPage: parseInt(page),
      totalCustomers,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching customers", error: error.message });
  }
};

export const getCustomerDetails = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const orders = await Order.find({ user: customerId })
      .populate("orderItems.product", "name images")
      .sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled"
    ).length;
    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered"
    ).length;
    const totalSpent = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.totalPrice, 0);

    const totalItems = orders
      .filter((order) => order.status !== "cancelled")
      .reduce(
        (sum, order) =>
          sum +
          order.orderItems.reduce(
            (itemSum, item) => itemSum + item.quantity,
            0
          ),
        0
      );

    // Calculate commission (assuming 10% commission)
    const commission = totalSpent * 0.1;

    const orderDetails = orders.map((order) => ({
      orderId: order._id,
      orderDate: order.createdAt,
      totalItems: order.orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      totalAmount: order.totalPrice,
      status: order.status,
      paymentMethod: order.paymentMethod,
      products: order.orderItems.map((item) => ({
        name: item.product?.name,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    res.json({
      customer: {
        name: customer.name || "N/A",
        email: customer.email || "N/A",
        phone: customer.phone,
        gender: customer.gender || "N/A",
        signupDate: customer.createdAt,
        isActive: customer.isActive,
      },
      stats: {
        totalOrders,
        cancelledOrders,
        deliveredOrders,
        totalSpent,
        totalItems,
        commission,
      },
      orders: orderDetails,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching customer details",
        error: error.message,
      });
  }
};

export const toggleCustomerStatus = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    res.json({
      message: `Customer ${
        customer.isActive ? "activated" : "blocked"
      } successfully`,
      customer: {
        id: customer._id,
        phone: customer.phone,
        isActive: customer.isActive,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error updating customer status",
        error: error.message,
      });
  }
};

// Product Management for Admin
export const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ stock: { $gt: 0 } });
    const outOfStock = await Product.countDocuments({ stock: 0 });

    // Most sold products
    const bestSellers = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          totalSold: { $sum: "$orderItems.quantity" },
          revenue: {
            $sum: { $multiply: ["$orderItems.quantity", "$orderItems.price"] },
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      totalProducts,
      activeProducts,
      outOfStock,
      bestSellers,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching product stats", error: error.message });
  }
};
