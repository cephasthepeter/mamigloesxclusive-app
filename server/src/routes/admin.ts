import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', [protect, authorize('admin')], async (req, res, next) => {
  try {
    // Get order stats
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });

    // Get revenue stats
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['Shipped', 'Delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Get product stats
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const outOfStockProducts = await Product.countDocuments({ stock: 0, isActive: true });

    // Get user stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('id total status createdAt user');

    res.status(200).json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders
        },
        revenue: totalRevenue[0]?.total || 0,
        products: {
          total: totalProducts,
          active: activeProducts,
          outOfStock: outOfStockProducts
        },
        users: {
          total: totalUsers,
          active: activeUsers
        },
        recentOrders
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders (admin)
// @access  Private/Admin
router.get('/orders', [protect, authorize('admin')], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startIndex = (page - 1) * limit;

    const { status, user } = req.query;

    let query: any = {};
    if (status) query.status = status;
    if (user) query.user = user;

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total
      },
      data: orders
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status (admin)
// @access  Private/Admin
router.put('/orders/:id/status', [
  protect,
  authorize('admin')
], async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (admin)
// @access  Private/Admin
router.get('/users', [protect, authorize('admin')], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startIndex = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      },
      data: users
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (admin)
// @access  Private/Admin
router.put('/users/:id/role', [
  protect,
  authorize('admin')
], async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
});

export default router;