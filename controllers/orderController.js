export const createOrder = (req, res) => {
  console.log('Create Order called at', new Date().toLocaleString());
  res.status(201).json({ message: 'Order created successfully' });
};

export const getAllOrders = (req, res) => {
  console.log('Get All Orders called at', new Date().toLocaleString());
  res.status(200).json({ message: 'Fetched all orders' });
};

export const getOrderById = (req, res) => {
  console.log('Get Order By ID called at', new Date().toLocaleString());
  res.status(200).json({ message: `Fetched order with ID: ${req.params.id}` });
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