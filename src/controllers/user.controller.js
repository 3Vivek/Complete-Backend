import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { UploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToke = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

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

  const { accessToken, refreshToken } = await generateAccessAndRefreshToke(
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
   const decodedToken=jwt.verify(
    incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
   )
   const user=User.findById(decodedToken?._id)
   if(!user) throw new ApiError(401,"Inavlid refresh token!!");
   if(incomingRefreshAccessToken!==user?.refreshToken){
     throw new ApiError(401,"Refresh Token is expired or used");
   }
 
   const options={
     httpOnly:true,
     secure:true
   }
   const {accessToken,newRefreshToken}=await generateAccessAndRefreshToke(user._id);
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newRefreshToken,options)
   .json(
     new ApiResponse(
       200,
       {accessToken,refreshToken:newRefreshToken},
       "Access token refreshed..."
     )
   )
 } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
 }



});

export { registerUser, loginUser, logoutUser,refreshAccessToken };
