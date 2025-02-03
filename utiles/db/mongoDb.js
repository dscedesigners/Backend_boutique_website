// import mongoose from "mongoose";

// const connectmongoDb =async()=>{
//     try {
//         await mongoose.connect(process.env.MONGO_URL)
//         console.log(`MongoDB is connected!`);
//     } catch (error) {
//         console.error(`ERROR:${error.message}`)
//         process.exit(1)
//     }
// }
// export default connectmongoDb


import mongoose from 'mongoose';

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function connectmongoDb() {
  try {
    await mongoose.connect(process.env.MONGO_URL, clientOptions);
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

export default connectmongoDb;