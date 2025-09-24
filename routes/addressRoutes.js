import express from 'express';
import { createAddress, getAllAddresses, getAddressById, updateAddress, deleteAddress, setDefaultAddress, getDefaultAddress } from '../controllers/addressController.js';
import verifyToken from '../middlewares/verifyToken.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.post('/', verifyToken, createAddress);
  router.get('/', verifyToken, getAllAddresses);
  router.get('/default', verifyToken, getDefaultAddress);
  router.get('/:id', verifyToken, getAddressById);
  router.put('/:id', verifyToken, updateAddress);
  router.delete('/:id', verifyToken, deleteAddress);
  router.patch('/:id/default', verifyToken, setDefaultAddress);

  return router;
};

export default RouteTemplate();