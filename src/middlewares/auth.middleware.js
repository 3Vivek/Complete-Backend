import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  //token paane ke lie (if cookie me na mile) then header me paao aur bs token nikalo baaki string me se
  try {
    // console.log("req is: ",req.cookies?.accessToken,"req header: ",req.header("Authorization"));

    // const token =
    //   req.cookies?.accessToken ||
    //   req.header("Authorization")?.replace("Bearer", " ");
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // console.log("tokennnn ",token);

    if (!token) {
      throw new ApiError(401, "Unauthorized Request!!");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access token !!");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
  
});
