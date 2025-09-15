export const createRefund = (req, res) => {
  console.log('Create Refund called at', new Date().toLocaleString());
  res.status(201).json({ message: 'Refund created successfully' });
};

export const getAllRefunds = (req, res) => {
  console.log('Get All Refunds called at', new Date().toLocaleString());
  res.status(200).json({ message: 'Fetched all refunds' });
};

export const getRefundById = (req, res) => {
  console.log('Get Refund By ID called at', new Date().toLocaleString());
  res.status(200).json({ message: `Fetched refund with ID: ${req.params.id}` });
};

export const updateRefund = (req, res) => {
  console.log('Update Refund called at', new Date().toLocaleString());
  res.status(200).json({ message: `Refund with ID ${req.params.id} updated` });
};

export const deleteRefund = (req, res) => {
  console.log('Delete Refund called at', new Date().toLocaleString());
  res.status(200).json({ message: `Refund with ID ${req.params.id} deleted` });
};