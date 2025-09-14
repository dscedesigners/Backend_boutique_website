import express from "express";
const router = express.Router()

import {
    createProduct,
    getAllProducts,
    getSingleProduct,
    getTopProducts,
    getProductStats
} from '../controllers/productController.js'

router.route('/createProduct').post(createProduct)
router.route('/getproducts').get(getAllProducts)
router.route('/getproduct/:productId').get(getSingleProduct)

// NEW ROUTES
router.route('/top').get(getTopProducts)
router.route('/stats').get(getProductStats)

export default router