export const createAddress = (req, res) => {
  console.log('Create Address called at', new Date().toLocaleString());
  res.status(201).json({ message: 'Address created successfully' });
};

export const getAllAddresses = (req, res) => {
  console.log('Get All Addresses called at', new Date().toLocaleString());
  res.status(200).json({ message: 'Fetched all addresses' });
};

export const getAddressById = (req, res) => {
  console.log('Get Address By ID called at', new Date().toLocaleString());
  res.status(200).json({ message: `Fetched address with ID: ${req.params.id}` });
};

export const updateAddress = (req, res) => {
  console.log('Update Address called at', new Date().toLocaleString());
  res.status(200).json({ message: `Address with ID ${req.params.id} updated` });
};

export const deleteAddress = (

req, res) => {
  console.log('Delete Address called at', new Date().toLocaleString());
  res.status(200).json({ message: `Address with ID ${req.params.id} deleted` });
};

export const setDefaultAddress = (req, res) => {
  console.log('Set Default Address called at', new Date().toLocaleString());
  res.status(200).json({ message: `Address with ID ${req.params.id} set as default` });
};