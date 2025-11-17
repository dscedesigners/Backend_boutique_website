import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

// Add or update product in cart
export const addItemToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id; // Extracted from JWT token

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Product ID and valid quantity are required' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        cartItems: [{ product: productId, quantity }],
      });
    } else {
      // Check if product already exists in cart
      const itemIndex = cart.cartItems.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Update quantity if product exists
        cart.cartItems[itemIndex].quantity = quantity;
      } else {
        // Add new product to cart
        cart.cartItems.push({ product: productId, quantity });
      }
    }

    await cart.save();
    res.status(200).json({ message: 'Item added/updated in cart'});
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove product from cart
export const removeItemFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id; // Extracted from JWT token

    // Find cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Filter out the product
    cart.cartItems = cart.cartItems.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    res.status(200).json({ message: 'Item removed from cart'});
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all products in cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const TAX_RATE = 5; // 5% tax

    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'cartItems.product',
      select: 'name cloth color size thumbnail stock price',
    });

    if (!cart || cart.cartItems.length === 0) {
      return res.status(200).json({
        cartItems: [],
        subtotal: 0,
        taxrate: TAX_RATE,
        total: 0,
        itemCount: 0,
      });
    }

    const formattedItems = cart.cartItems.map((item) => ({
      productId: item.product._id,
      quantity: item.quantity,
      name: item.product.name,
      cloth: item.product.cloth,
      color: item.product.color,
      size: item.product.size,
      thumbnail: item.product.thumbnail,
      stock: item.product.stock,
      price: item.product.price,
    }));

    const subtotal = formattedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const tax = subtotal * (TAX_RATE / 100);
    const total = subtotal + tax;

    res.status(200).json({
      cartItems: formattedItems,
      subtotal,
      taxrate: TAX_RATE,
      total,
      itemCount: formattedItems.length,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getCartLength = async (req, res) => {
  try {
    const userId = req.user.id;               // from verifyToken

    const cart = await Cart.findOne({ user: userId })
      .select('cartItems');                  // we only need the array

    const length = cart ? cart.cartItems.length : 0;

    res.status(200).json({ length });
  } catch (error) {
    console.error('Error fetching cart length:', error);
    res.status(500).json({ message: 'Server error' });
  }
};