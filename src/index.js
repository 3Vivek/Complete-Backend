// require('dotenv'.config({path:'./env'}))

import connectDB from "./db/index.js";
import dotenv from 'dotenv'

dotenv.config({
    path:'./env'
})

connectDB()


// Apporach 1 for DB connection ------------------------------


// const app=express();
//IIFE - immediately execute function , because we are connecting DB
// (async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         //to check established connection whether successfull or not
//         app.on("error",(error)=>{
//             console.log("Error",error);
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on ${process.env.PORT}`);
            
//         })
//     } catch (error) {
//         console.error("ERROR",error);
//         throw error
//     }
// })()