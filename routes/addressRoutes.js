import express from 'express';
import { createAddress, getAllAddresses, getAddressById, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/addressController.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.post('/', createAddress);
  router.get('/', getAllAddresses);
  router.get('/:id', getAddressById);
  router.put('/:id', updateAddress);
  router.delete('/:id', deleteAddress);
  router.patch('/:id/default', setDefaultAddress);

  return router;
};

export default RouteTemplate();