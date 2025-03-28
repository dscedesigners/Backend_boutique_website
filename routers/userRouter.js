import express from 'express'
import multer from 'multer'

//cloudinory storage of image 
import {cloudinary} from '../utiles/cloudinary.js'
import {CloudinaryStorage} from 'multer-storage-cloudinary'

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params:{
        folder : "botique_strorage",
        public_id :(req,file) =>`${Date.now()}`,
        transformation : [
            {width:800,height:600,crop:"limit"},
            {quality:"auto:good"}
        ]
    }
})
const upload =multer({storage});

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
router.patch('/update/:userId',upload.single('img'),UpdateUserProfile)
router.get('/user/:userId',getUser)


//cart ------------
router.post('/addtocart',addToCart)
router.delete('/removefromcart',removeOneFromCart)
router.delete('/removeproductfromcart',removeFromCart)
router.get("/cartitems/:userId",userCartItems)

//product ------------

export default router