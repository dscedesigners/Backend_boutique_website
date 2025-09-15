export const createCart = (req, res) => {
  console.log('Create Cart called at', new Date().toLocaleString());
  res.status(201).json({ message: 'Cart created successfully' });
};

export const getCart = (req, res) => {
  console.log('Get Cart called at', new Date().toLocaleString());
  res.status(200).json({ message: `Fetched cart with ID: ${req.params.id}` });
};

export const updateCart = (req, res) => {
  console.log('Update Cart called at', new Date().toLocaleString());
  res.status(200).json({ message: `Cart with ID ${req.params.id} updated` });
};

export const deleteCart = (req, res) => {
  console.log('Delete Cart called at', new Date().toLocaleString());
  res.status(200).json({ message: `Cart with ID ${req.params.id} deleted` });
};

export const addItemToCart = (req, res) => {
  console.log('Add Item To Cart called at', new Date().toLocaleString());
  res.status(200).json({ message: `Item added to cart with ID ${req.params.id}` });
};

export const removeItemFromCart = (req, res) => {
  console.log('Remove Item From Cart called at', new Date().toLocaleString());
  res.status(200).json({ message: `Item ${req.params.itemId} removed from cart with ID ${req.params.id}` });
};