import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// Get all users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.json({
    success: true,
    data: users,
    message: "Users retrieved successfully"
  });
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, department } = req.body;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.role = role || user.role;
  user.department = role === "Admin" ? null : department || user.department;

  await user.save();
  
  res.json({
    success: true,
    data: user,
    message: "User updated successfully"
  });
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await user.deleteOne();
  
  res.json({
    success: true,
    message: "User deleted successfully"
  });
});

export { getUsers, updateUser, deleteUser };
