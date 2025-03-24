// require('dotenv'.config({path:'./env'}))

import connectDB from "./db/index.js";
import dotenv from 'dotenv';
import { app } from "./app.js";

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed !!",err);
    
})




















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