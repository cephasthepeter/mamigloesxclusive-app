import express, { Request, Response } from 'express';
import Address from '../models/Address.js';
import { clerkAuth } from '../middleware/clerkAuth.js';

const router = express.Router();

// Get all addresses for a user
router.get('/', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching addresses', error });
  }
});

// Get a single address
router.get('/:id', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const address = await Address.findOne({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching address', error });
  }
});

// Create a new address
router.post('/', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { label, line1, line2, city, state, country, zipCode, phone, isDefault } = req.body;

    // Validate required fields
    if (!label || !line1 || !city || !state || !country || !zipCode) {
      return res.status(400).json({ message: 'All required address fields must be provided' });
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await Address.updateMany(
        { user: userId, isDefault: true },
        { isDefault: false }
      );
    }

    const address = await Address.create({
      user: userId,
      label,
      line1,
      line2,
      city,
      state,
      country,
      zipCode,
      phone,
      isDefault: isDefault || false
    });

    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: 'Error creating address', error });
  }
});

// Update an address
router.put('/:id', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const address = await Address.findOne({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const { label, line1, line2, city, state, country, zipCode, phone, isDefault } = req.body;

    // If this is set as default, unset other default addresses
    if (isDefault && !address.isDefault) {
      await Address.updateMany(
        { user: userId, isDefault: true, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    // Update fields
    if (label !== undefined) address.label = label;
    if (line1 !== undefined) address.line1 = line1;
    if (line2 !== undefined) address.line2 = line2;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (country !== undefined) address.country = country;
    if (zipCode !== undefined) address.zipCode = zipCode;
    if (phone !== undefined) address.phone = phone;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();

    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Error updating address', error });
  }
});

// Delete an address
router.delete('/:id', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const address = await Address.findOneAndDelete({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error });
  }
});

// Set an address as default
router.patch('/:id/default', clerkAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const address = await Address.findOne({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Unset other default addresses
    await Address.updateMany(
      { user: userId, isDefault: true, _id: { $ne: id } },
      { isDefault: false }
    );

    address.isDefault = true;
    await address.save();

    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Error setting default address', error });
  }
});

export default router;