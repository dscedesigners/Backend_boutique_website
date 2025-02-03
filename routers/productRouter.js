import express from "express";
const router = express.Router()

import {
    createProduct,
    getAllProducts,
    getSingleProduct
} from '../controllers/productController.js'

router.route('/createProduct').post(createProduct)
router.route('/getproducts').get(getAllProducts)
router.route('/getproduct/:productId').get(getSingleProduct)

export default router