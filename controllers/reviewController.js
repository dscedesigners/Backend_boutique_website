export const createReview = (req, res) => {
  console.log('Create Review called at', new Date().toLocaleString());
  res.status(201).json({ message: 'Review created successfully' });
};

export const getAllReviews = (req, res) => {
  console.log('Get All Reviews called at', new Date().toLocaleString());
  res.status(200).json({ message: 'Fetched all reviews' });
};

export const getReviewById = (req, res) => {
  console.log('Get Review By ID called at', new Date().toLocaleString());
  res.status(200).json({ message: `Fetched review with ID: ${req.params.id}` });
};

export const updateReview = (req, res) => {
  console.log('Update Review called at', new Date().toLocaleString());
  res.status(200).json({ message: `Review with ID ${req.params.id} updated` });
};

export const deleteReview = (req, res) => {
  console.log('Delete Review called at', new Date().toLocaleString());
  res.status(200).json({ message: `Review with ID ${req.params.id} deleted` });
};