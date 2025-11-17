// controllers/orderController.js
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import mongoose from 'mongoose';

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  let hasCommitted = false;

  try {
    session.startTransaction();

    const userId = req.user.id;
    const { addressId, totalAmount } = req.body;

    if (!addressId || !totalAmount) {
      return res.status(400).json({ message: 'addressId and totalAmount are required' });
    }

    const cart = await Cart.findOne({ user: userId })
      .populate('cartItems.product', 'name price stock')
      .session(session);

    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let subtotal = 0;
    const errors = [];

    for (const item of cart.cartItems) {
      const product = item.product;
      if (!product) {
        errors.push(`Product not found: ${item.product}`);
        continue;
      }
      if (item.quantity > product.stock) {
        errors.push(`${product.name}: Only ${product.stock} left (requested: ${item.quantity})`);
      } else {
        subtotal += product.price * item.quantity;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Some items are not available. Check the cart.',
        errors
      });
    }

    const tax = Number((subtotal * 0.05).toFixed(2));
    const calculatedTotal = Number((subtotal + tax).toFixed(2));

    if (calculatedTotal !== Number(totalAmount)) {
      return res.status(400).json({
        message: 'Total amount mismatch',
        expected: calculatedTotal,
        received: Number(totalAmount)
      });
    }

    // Reduce stock
    for (const item of cart.cartItems) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // Create order
    const order = new Order({
      user: userId,
      orderItems: cart.cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        paymentId: null,
        paymentStatus: 'Pending',
        trackingId: null,
        orderStatus: 'Processing'
      })),
      shippingAddress: addressId,
      paymentMethod: 'COD',
      paymentDetails: {
        subtotal,
        tax,
        shipping: 0,
        processing: 0,
        totalPrice: calculatedTotal
      },
      currency: 'INR'
    });

    await order.save({ session });

    // Clear cart
    await Cart.deleteOne({ user: userId }, { session });

    // Commit transaction
    await session.commitTransaction();
    hasCommitted = true; // ← MARK AS COMMITTED

    // --- SAFE TO POPULATE AFTER COMMIT ---
    const populatedOrder = await Order.findById(order._id)
      .populate('orderItems.product', 'name thumbnail')
      .populate('shippingAddress', 'street city state pincode')
      .lean();

    res.status(201).json({
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    // Only abort if not already committed
    if (!hasCommitted && session.transaction.isActive) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.warn('Abort failed (already committed?):', abortError.message);
      }
    }
    console.error('Order creation failed:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  } finally {
    session.endSession();
  }
};

// export const createOrder = (req, res) => {
//   console.log('Get All Orders called at', new Date().toLocaleString());
//   res.status(200).json({ message: 'Fetched all orders' });
// };

export const getAllOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 1; // One order per page
    const skip = (page - 1) * limit;

    // Count total orders
    const total = await Order.countDocuments({ user: userId });

    // Fetch one order with populated data
    const order = await Order.findOne({ user: userId })
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .populate('orderItems.product', 'name thumbnail')
      .populate('shippingAddress', 'street city state pincode')
      .select(`
        _id 
        paymentMethod 
        orderItems.product 
        orderItems.quantity 
        orderItems.price 
        orderItems.orderStatus 
        orderItems.paymentStatus 
        paymentDetails.totalPrice 
        createdAt
      `)
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'No orders found' });
    }

    // Format response exactly as requested
    const formattedOrder = {
      orderId: order._id,
      paymentMethod: order.paymentMethod,
      totalAmount: order.paymentDetails.totalPrice,
      createdAt: order.createdAt,
      items: order.orderItems.map(item => ({
        productId: item.product._id,
        thumbnail: item.product.thumbnail,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        orderStatus: item.orderStatus,
        paymentStatus: item.paymentStatus
      }))
    };

    res.status(200).json({
      message: 'Order fetched successfully',
      data: formattedOrder,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { productId } = req.query;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(orderId) || !productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Fetch order with full address fields
    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate('orderItems.product', 'name thumbnail size color cloth')
      .populate({
        path: 'shippingAddress',
        select: 'fullName contactPhone street city state country zipCode email'
      })
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const targetItem = order.orderItems.find(
      item => item.product._id.toString() === productId
    );

    if (!targetItem) {
      return res.status(404).json({ message: 'Product not found in this order' });
    }

    const otherProducts = order.orderItems
      .filter(item => item.product._id.toString() !== productId)
      .map(item => ({
        productId: item.product._id,
        thumbnail: item.product.thumbnail
      }));

    // Format createdAt in IST: DD/MM/YYYY HH:MM:SS
    const istDate = new Date(order.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');

    res.status(200).json({
      orderId: order._id,
      productId: targetItem.product._id,
      thumbnail: targetItem.product.thumbnail,
      price: targetItem.price,
      qty: targetItem.quantity,
      size: targetItem.product.size,
      color: targetItem.product.color,
      cloth: targetItem.product.cloth,
      shippingDetails: {
        fullName: order.shippingAddress.fullName,
        contactPhone: order.shippingAddress.contactPhone || null,
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        country: order.shippingAddress.country,
        zipCode: order.shippingAddress.zipCode,
        email: order.shippingAddress.email
      },
      paymentId: targetItem.paymentId,
      paymentStatus: targetItem.paymentStatus,
      trackingId: targetItem.trackingId,
      orderStatus: targetItem.orderStatus,
      otherProductsInSameOrder: otherProducts,
      createdAt: istDate,
      paymentMethod: order.paymentMethod,
      name:targetItem.product.name,

    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateOrder = (req, res) => {
  console.log('Update Order called at', new Date().toLocaleString());
  res.status(200).json({ message: `Order with ID ${req.params.id} updated` });
};

export const deleteOrder = (req, res) => {
  console.log('Delete Order called at', new Date().toLocaleString());
  res.status(200).json({ message: `Order with ID ${req.params.id} deleted` });
};

export const updateOrderStatus = (req, res) => {
  console.log('Update Order Status called at', new Date().toLocaleString());
  res.status(200).json({ message: `Order status with ID ${req.params.id} updated` });
};