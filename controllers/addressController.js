import Address from '../models/addressModel.js';
import mongoose from 'mongoose';

export const createAddress = async (req, res) => {
  try {
    const { fullName, street, city, state, country, zipCode, contactPhone, alternateContactPhone, email, isDefault } = req.body;
    
    // Validate required fields
    if (!fullName || !street || !city || !state || !country || !zipCode || !email) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Create new address
    const address = new Address({
      user: req.user.id,
      fullName,
      street,
      city,
      state,
      country,
      zipCode,
      contactPhone,
      alternateContactPhone,
      email,
      isDefault: isDefault || false
    });

    // If setting as default, unset other default addresses
    if (isDefault) {
      await Address.updateMany({ user: req.user.id, isDefault: true }, { isDefault: false });
    }

    await address.save();
    res.status(201).json({ 
      message: 'Address created successfully',
      address: {
        id: address._id,
        fullName: address.fullName,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        zipCode: address.zipCode,
        contactPhone: address.contactPhone,
        alternateContactPhone: address.alternateContactPhone,
        email: address.email,
        isDefault: address.isDefault
      }
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ message: 'Error creating address', error: error.message });
  }
};

export const getAllAddresses = async (req, res) => {
  try {
    console.log('Get All Addresses called at', new Date().toLocaleString());
    const userId = req.user.id;
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get default address
    const defaultAddress = await Address.findOne({ user: userId, isDefault: true })
      .select('id fullName street contactPhone isDefault');

    // Get total count of non-default addresses
    const totalNonDefault = await Address.countDocuments({ user: userId, isDefault: false });

    // Get paginated non-default addresses, sorted by createdAt descending
    const nonDefaultAddresses = await Address.find({ user: userId, isDefault: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('id fullName street contactPhone isDefault');

    // Combine addresses: default (if exists) + paginated non-default
    const addresses = defaultAddress 
      ? [{ 
          id: defaultAddress._id,
          fullName: defaultAddress.fullName,
          street: defaultAddress.street,
          contactPhone: defaultAddress.contactPhone,
          isDefault: defaultAddress.isDefault
        }, ...nonDefaultAddresses.map(addr => ({
          id: addr._id,
          fullName: addr.fullName,
          street: addr.street,
          contactPhone: addr.contactPhone,
          isDefault: addr.isDefault
        }))]
      : nonDefaultAddresses.map(addr => ({
          id: addr._id,
          fullName: addr.fullName,
          street: addr.street,
          contactPhone: addr.contactPhone,
          isDefault: addr.isDefault
        }));

    // Calculate total count (including default address if exists)
    const totalCount = totalNonDefault + (defaultAddress ? 1 : 0);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      message: 'Fetched all addresses',
      addresses,
      pagination: {
        totalCount,
        currentPage: page,
        totalPages,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Error fetching addresses', error: error.message });
  }
};

export const getAddressById = async (req, res) => {
  try {
    console.log('Get Address By ID called at', new Date().toLocaleString());
    const addressId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'Invalid address ID format' });
    }
    const address = await Address.findOne({ _id: addressId, user: req.user.id }).select('-user -__v');
    if (!address) {
      return res.status(404).json({ message: 'Address not found or not authorized' });
    }
    res.status(200).json({ 
      message: `Fetched address with ID: ${addressId}`,
      address: {
        id: address._id,
        fullName: address.fullName,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        zipCode: address.zipCode,
        contactPhone: address.contactPhone,
        alternateContactPhone: address.alternateContactPhone,
        email: address.email,
        isDefault: address.isDefault
      }
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ message: 'Error fetching address', error: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    console.log('Update Address called at', new Date().toLocaleString());
    const addressId = req.params.id;
    const { fullName, street, city, state, country, zipCode, contactPhone, alternateContactPhone, email, isDefault } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'Invalid address ID format' });
    }
    
    const address = await Address.findOne({ _id: addressId, user: req.user.id });
    if (!address) {
      return res.status(404).json({ message: 'Address not found or not authorized' });
    }

    // Update fields if provided
    if (fullName) address.fullName = fullName;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (country) address.country = country;
    if (zipCode) address.zipCode = zipCode;
    if (contactPhone) address.contactPhone = contactPhone;
    if (alternateContactPhone) address.alternateContactPhone = alternateContactPhone;
    if (email) address.email = email;
    if (typeof isDefault === 'boolean') {
      address.isDefault = isDefault;
      if (isDefault) {
        await Address.updateMany({ user: req.user.id, isDefault: true, _id: { $ne: addressId } }, { isDefault: false });
      }
    }

    await address.save();
    res.status(200).json({ 
      message: `Address with ID ${addressId} updated`,
      address: {
        id: address._id,
        fullName: address.fullName,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        zipCode: address.zipCode,
        contactPhone: address.contactPhone,
        alternateContactPhone: address.alternateContactPhone,
        email: address.email,
        isDefault: address.isDefault
      }
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    
    const addressId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'Invalid address ID format' });
    }
    const address = await Address.findOneAndDelete({ _id: addressId, user: req.user.id });
    if (!address) {
      return res.status(404).json({ message: 'Address not found or not authorized' });
    }
    res.status(200).json({ message: `Address with ID ${addressId} deleted` });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    
    const addressId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'Invalid address ID format' });
    }
    const address = await Address.findOne({ _id: addressId, user: req.user.id });
    if (!address) {
      return res.status(404).json({ message: 'Address not found or not authorized' });
    }
    // Unset other default addresses
    await Address.updateMany({ user: req.user.id, isDefault: true }, { isDefault: false });
    // Set this address as default
    address.isDefault = true;
    await address.save();
    res.status(200).json({ 
      message: `Address with ID ${addressId} set as default`,
      address: {
        id: address._id,
        fullName: address.fullName,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        zipCode: address.zipCode,
        contactPhone: address.contactPhone,
        alternateContactPhone: address.alternateContactPhone,
        email: address.email,
        isDefault: address.isDefault
      }
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ message: 'Error setting default address', error: error.message });
  }
};

export const getDefaultAddress = async (req, res) => {
  try {
    console.log('Get Default Address called at', new Date().toLocaleString());
    const userId = req.user.id; // From verifyToken middleware
    let address = await Address.findOne({ user: userId, isDefault: true }).select('-user -__v');
    
    let message = 'Fetched default address';
    if (!address) {
      // If no default address, get the most recently added address
      address = await Address.findOne({ user: userId })
        .sort({ createdAt: -1 }) // Sort by createdAt descending
        .select('-user -__v');
      if (!address) {
        return res.status(404).json({ message: 'No addresses found for this user' });
      }
      message = 'No default address found, returning most recently added address';
    }

    res.status(200).json({ 
      message,
      address: {
        id: address._id,
        fullName: address.fullName,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        zipCode: address.zipCode,
        contactPhone: address.contactPhone,
        alternateContactPhone: address.alternateContactPhone,
        email: address.email,
        isDefault: address.isDefault
      }
    });
  } catch (error) {
    console.error('Error fetching default address:', error);
    res.status(500).json({ message: 'Error fetching default address', error: error.message });
  }
};