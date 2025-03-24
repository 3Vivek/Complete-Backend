//to provide a common async function throughout the app
// Method 1-------------------
const asyncHandler=(requesHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requesHandler(req,res,next))
        .catch((err)=>next(err))
    }
}

export {asyncHandler}


//higher order function- a function return function
// const asyncHandler=()=>{}
// const asyncHandler=(func)=>()=>{}
// const asyncHandler=(func)=>async()=>{}


//          Method 2 for asyncHandler---------------------------
// const asyncHandler=(fn)=>async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
        
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }

//Sending response is also standardized as sometime we dont remember response format