import express from "express";
import dotenv from 'dotenv'
import cors from 'cors'
dotenv.config()

//mongoDB 
import connectmongoDb from "./utiles/db/mongoDb.js";
connectmongoDb()

//routers
import userRouter from './routers/userRouter.js'
import orderRouter from './routers/orderRouter.js'
import productRouter from './routers/productRouter.js'
import authRouter from './routers/authRouter.js';
import adminRouter from './routers/adminRouter.js';

const PORT = process.env.PORT || 5000
const app = express()

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//user the cart crud will by the users api
app.use('/api/users',userRouter)
app.use('/api/auth', authRouter);

//for order we have to check weather the user have token then we have to do crud of the order over here
app.use('/api/order',orderRouter)
app.use('/api/product',productRouter)
app.use('/api/admin', adminRouter)

app.all("*",()=>{
    throw new Error("Invalid route")
})

app.listen(PORT,console.log(`Server running at PORT:${PORT}`))