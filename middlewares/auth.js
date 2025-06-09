import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;
  console.log("Auth headers:", req.headers.authorization);
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token extracted:", token);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);
      
      const user = await User.findById(decoded.id).select("-password");
      console.log("User found:", user ? "Yes" : "No");
      
      if (!user) {
        res.status(401);
        throw new Error("User not found");
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      res.status(401);
      throw new Error("Not authorized, token failed: " + error.message);
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("Not authorized to access this resource");
    }
    next();
  };
};

export { protect, restrictTo };
