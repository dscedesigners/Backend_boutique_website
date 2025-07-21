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

const PORT = process.env.PORT || 5000
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//user 
app.use('/api/users',userRouter)
app.use('/api/auth', authRouter);

app.use('/api/order',orderRouter)
app.use('/api/product',productRouter)

app.all("*",()=>{
    throw new Error("Invalid route")
})

app.listen(PORT,console.log(`Server running at PORT:${PORT}`))