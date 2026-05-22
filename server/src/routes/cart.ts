import express, { Request, Response } from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { clerkAuth } from '../middleware/clerkAuth.js';

const router = express.Router();

// Get user's cart
router.get('/', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [], total: 0 });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error });
  }
});

// Add item to cart
router.post('/add', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const { productId, quantity = 1, size, color } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [], total: 0 });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => 
        item.product.toString() === productId &&
        item.variant?.size === size &&
        item.variant?.color === color
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        variant: { size, color }
      });
    }

    // Calculate total
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error });
  }
});

// Update cart item quantity
router.put('/update/:productId', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const { productId } = req.params;
    const { quantity, size, color } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find the item
    const itemIndex = cart.items.findIndex(
      (item) => 
        item.product.toString() === productId &&
        item.variant?.size === size &&
        item.variant?.color === color
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Verify stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    cart.items[itemIndex].quantity = quantity;
    
    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart', error });
  }
});

// Remove item from cart
router.delete('/remove/:productId', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const { productId } = req.params;
    const { size, color } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => 
      !(item.product.toString() === productId &&
        item.variant?.size === size &&
        item.variant?.color === color)
    );
    
    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error removing from cart', error });
  }
});

// Clear cart
router.delete('/clear', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error });
  }
});

export default router;