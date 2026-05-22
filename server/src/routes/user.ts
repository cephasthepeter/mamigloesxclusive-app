import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import Address from '../models/Address.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/users/addresses
// @desc    Get user's addresses
// @access  Private
router.get('/addresses', protect, async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/users/addresses
// @desc    Add new address
// @access  Private
router.post('/addresses', [
  protect,
  body('label').isLength({ min: 1, max: 50 }).withMessage('Label is required and must be less than 50 characters'),
  body('line1').isLength({ min: 1, max: 100 }).withMessage('Address line 1 is required'),
  body('city').isLength({ min: 1, max: 50 }).withMessage('City is required'),
  body('state').isLength({ min: 1, max: 50 }).withMessage('State is required'),
  body('zipCode').isLength({ min: 1, max: 20 }).withMessage('ZIP code is required'),
  body('country').isLength({ min: 1, max: 50 }).withMessage('Country is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { label, line1, line2, city, state, zipCode, country, phone, isDefault } = req.body;

    // If this is the default address, unset other defaults
    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id },
        { isDefault: false }
      );
    }

    const address = await Address.create({
      user: req.user.id,
      label,
      line1,
      line2,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault: isDefault || false
    });

    // Update user's addresses array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { addresses: address._id }
    });

    res.status(201).json({
      success: true,
      data: address
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/users/addresses/:id
// @desc    Update address
// @access  Private
router.put('/addresses/:id', [
  protect,
  body('label').optional().isLength({ min: 1, max: 50 }).withMessage('Label must be less than 50 characters'),
  body('line1').optional().isLength({ min: 1, max: 100 }).withMessage('Address line 1 is required'),
  body('city').optional().isLength({ min: 1, max: 50 }).withMessage('City is required'),
  body('state').optional().isLength({ min: 1, max: 50 }).withMessage('State is required'),
  body('zipCode').optional().isLength({ min: 1, max: 20 }).withMessage('ZIP code is required'),
  body('country').optional().isLength({ min: 1, max: 50 }).withMessage('Country is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    const { isDefault } = req.body;

    // If setting as default, unset other defaults
    if (isDefault && !address.isDefault) {
      await Address.updateMany(
        { user: req.user.id },
        { isDefault: false }
      );
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedAddress
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/users/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/addresses/:id', protect, async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    // Remove from user's addresses array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { addresses: req.params.id }
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/users/addresses/:id/default
// @desc    Set address as default
// @access  Private
router.put('/addresses/:id/default', protect, async (req, res, next) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    // Unset all defaults
    await Address.updateMany(
      { user: req.user.id },
      { isDefault: false }
    );

    // Set this as default
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (err) {
    next(err);
  }
});

export default router;