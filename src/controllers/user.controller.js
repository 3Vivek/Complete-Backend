import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { UploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Mongoose } from "mongoose";
import { json } from "express";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    //console.log("AccessToken",accessToken,"RefreshToken",refreshToken);
    
    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token!!!"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  console.log("Uploaded Files:", req.files); // Debugging line
  //get user details from frontend
  //validation -not empty
  //check if user already exist:username,email
  //check for images ,check for avatar
  //upload them to cloudinary,avatar check
  //create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response
  const { fullname, email, username, password } = req.body;
  console.log(fullname, email);

  if (fullname === "") {
    throw new ApiError(400, "Fullname is required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // to check username or email in db
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path; //check for avatar that are uploaded via multer
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await UploadCloudinary(avatarLocalPath);
  const coverImage = await UploadCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" //remove extra field
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body->data
  //username or email
  //find the userth
  //password check
  //access and refresh token
  //send cookies

  const { email, username, password } = req.body;
  if (!(username || email))
    throw new ApiError(400, "username or email is required");

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) throw new ApiError(404, "User not exist");

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new ApiError(401, "Password Incorrect !!!");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //by this you cant modify the cookies only modified on server not on client
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log("reqdsdf2332", req);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout out successfully...."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
  }

  try {
      const decodedToken = jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET
      )
  
      const user = await User.findById(decodedToken?._id)
  
      if (!user) {
          throw new ApiError(401, "Invalid refresh token")
      }
  
      if (incomingRefreshToken !== user?.refreshToken) {
          throw new ApiError(401, "Refresh token is expired or used")
          
      }
  
      const options = {
          httpOnly: true,
          secure: true
      }
  
      const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
      console.log("access",accessToken);
      console.log("refresh",refreshToken);
      
      
  
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
          new ApiResponse(
              200, 
              {accessToken, refreshToken: refreshToken},
              "Access token refreshed"
          )
      )
  } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body;
  const user=await User.findById(req.user?._id);
  const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect) throw new ApiError(400,"Invalid old password..!!!");

  user.password=newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password changed successfully..."))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"Current user fetched successfully...")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullname,email}=req.body;
  if(!fullname || !email) throw new ApiError(400,"All field are required..");

  const user=User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname,
        email
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiError(
    200,user,"Account details updated Successfully..."
  ))

})

const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path;
  if(!avatarLocalPath) throw new ApiError(400,"Avatar file is missing");

  const avatar=await UploadCloudinary(avatarLocalPath);

  if(!avatar.url) throw new ApiError(400,"Error while uploading on avatar");
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"Avatar image updated successfullly")
  )

})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path;
  if(!coverImageLocalPath) throw new ApiError(400,"Cover Image is missing");

  const coverImage=await UploadCloudinary(coverImageLocalPath);

  if(!coverImage.url) throw new ApiError(400,"Error while uploading on coverImage");
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"Cover image updated successfullly")
  )

})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
  const {username}=req.params
  if(!username?.trim()) throw new ApiError(400,"Username is missing");
  //make aggregate pipeline
  const channel=await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    // now we get username and want to lookup all the subscriber user have
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    // now number of subscribed channel user have done
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    //add upper result field combined them and add additonal field 
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            //check req.user in subscribers array if req.user exist as a subscriber exist
            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    // now use projection , only give selected value 
    {
      $project:{
        fullname:1,
        username:1,
        subscribersCount:1,
        channelSubscribedToCount:1,
        isSubscribed:1,
        avtar:1,
        coverImage:1,
        email:1,
      }
    }
  ])

  if(!channel?.length) throw new ApiError(404,"Channel does not exist...!!");

  return res
  .status(200)
  .json(
    new ApiError(200,channel[0],"User channel fetched successfully")
  )


})

const getWatchHistory=asyncHandler(async(req,res)=>{
  const user=await User.aggregate9[
    {
      $match:{
        //we cant directly get user._id as it is string to convert it into object we need
        _id:new Mongoose.Types.ObjectId(req.user._id)
      }
    },
    //now we need to add all the videos in watch history as per id
    // but we also need owner name so sub-pipeline required
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          // now we get all details in owner array - we want to make the data structure more efficient and readable
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          } 
        ]
      }
    }
  ]
  return res
  .status(200)
  ,json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch history fetched successfully...."
    )
  )
})


export { 
  registerUser, 
  loginUser, 
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser ,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
