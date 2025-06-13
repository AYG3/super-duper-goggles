import asyncHandler from "express-async-handler";
import MemoField from "../models/MemoField.js";

// Create memo field
const createMemoField = asyncHandler(async (req, res) => {
  const { name, type, required, options } = req.body;

  const fieldExists = await MemoField.findOne({ name });
  if (fieldExists) {
    res.status(400);
    throw new Error("Field with this name already exists");
  }

  const field = await MemoField.create({
    name,
    type,
    required,
    options,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: field,
    message: "Memo field created successfully"
  });
});

// Get all memo fields
const getMemoFields = asyncHandler(async (req, res) => {
  const fields = await MemoField.find().populate("createdBy", "name email");
  
  res.json({
    success: true,
    data: fields,
    message: "Memo fields retrieved successfully"
  });
});

export { createMemoField, getMemoFields };
