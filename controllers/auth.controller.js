import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Register user (admin only)
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    department: role === "Admin" ? null : department,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    token: generateToken(user._id, user.role),
  });
});

// Public user registration (for self-signup)
const registerPublicUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = "Staff", department } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  // For non-Admin users, department is required
  if (role !== "Admin" && !department) {
    res.status(400);
    throw new Error("Department is required for Staff and Student users");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Only allow Staff and Student roles for public registration
  const allowedRoles = ["Staff", "Student"];
  if (!allowedRoles.includes(role)) {
    res.status(400);
    throw new Error("Invalid role. Only Staff and Student roles are allowed for public registration");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    department: role === "Admin" ? null : department,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    token: generateToken(user._id, user.role),
  });
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      createdAt: user.createdAt
    },
    message: "Current user retrieved successfully"
  });
});

export { registerUser, loginUser, registerPublicUser, getCurrentUser };
