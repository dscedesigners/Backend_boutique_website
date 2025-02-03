import express from 'express'

const router = express.Router()
import { 
    CreateNewUser,
    UpdateUserProfile,
    addToCart,
    removeOneFromCart,
    getUser,
    userCartItems,
    removeFromCart
} from '../controllers/userControllers.js'

// profile --------------
router.post('/signup',CreateNewUser)
router.patch('/update/:userId',UpdateUserProfile)
router.get('/user/:userId',getUser)

//cart ------------
router.post('/addtocart',addToCart)
router.delete('/removefromcart',removeOneFromCart)
router.delete('/removeproductfromcart',removeFromCart)
router.get("/cartitems/:userId",userCartItems)

//product ------------

export default router