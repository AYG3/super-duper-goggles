import asyncHandler from "express-async-handler";
import Memo from "../models/Memo.js";
import MemoField from "../models/MemoField.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/email.js";

// Create and send memo
const createMemo = asyncHandler(async (req, res) => {
  const { recipients, department, content, title } = req.body;

  // Validate content against defined memo fields
  const fields = await MemoField.find();
  const contentKeys = Object.keys(content);
  for (const field of fields) {
    if (field.required && !contentKeys.includes(field.name)) {
      res.status(400);
      throw new Error(`Missing required field: ${field.name}`);
    }
  }

  // Validate recipients or department
  let recipientIds = [];
  if (recipients && recipients.length > 0) {
    // Ensure recipients are valid ObjectIds
    try {
      recipientIds = recipients;
    } catch (error) {
      res.status(400);
      throw new Error("Invalid recipient ID format");
    }
  } else if (department) {
    const users = await User.find({ department });
    recipientIds = users.map((user) => user._id);
  } else {
    res.status(400);
    throw new Error("Must specify recipients or department");
  }

  // Create status map for recipients
  const status = new Map();
  recipientIds.forEach((id) => {
    status.set(id.toString(), { status: "sent", timestamp: new Date() });
  });

  const memo = await Memo.create({
    sender: req.user._id,
    recipients: recipientIds,
    department,
    title,
    content,
    status,
  });

  // Try to send email notifications, but don't fail if email sending fails
  try {
    const recipientUsers = await User.find({ _id: { $in: recipientIds } });
    for (const user of recipientUsers) {
      try {
        await sendEmail({
          to: user.email,
          subject: "New Memo Received",
          text: `You have received a new memo from ${req.user.name}. Log in to view details.`,
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
        // Continue with next user even if email fails for one user
      }
    }
  } catch (emailsError) {
    console.error("Error sending notification emails:", emailsError);
    // Continue with response even if emails fail
  }

  res.status(201).json(memo);
});


// Get memos for user
const getMemos = asyncHandler(async (req, res) => {
  console.log("Getting memos for user:", req.user._id, "department:", req.user.department);
  
  const memos = await Memo.find({
    $or: [
      { sender: req.user._id },
      { recipients: req.user._id }, 
      { department: req.user.department }
    ],
  }).populate("sender", "name email");
  
  console.log("Found memos:", memos.length);
  res.json(memos);
});

// Get memo by ID
const getMemoById = asyncHandler(async (req, res) => {
  const memo = await Memo.findById(req.params.id).populate("sender", "name email");
  
  if (!memo) {
    res.status(404);
    throw new Error("Memo not found");
  }

  if (
    !memo.recipients.includes(req.user._id) &&
    memo.department !== req.user.department &&
    memo.sender.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to view this memo");
  }

  res.json(memo);
});

// Update memo status (e.g., read, acknowledged)
const updateMemoStatus = asyncHandler(async (req, res) => {
  const { memoId, status } = req.body;
  const memo = await Memo.findById(memoId);

  if (!memo) {
    res.status(404);
    throw new Error("Memo not found");
    
  }

  if (
    !memo.recipients.includes(req.user._id) &&
    memo.department !== req.user.department
  ) {
    res.status(403);
    throw new Error("Not authorized to update this memo");
  }

  memo.status.set(req.user._id.toString(), { status, timestamp: new Date() });
  memo.updatedAt = new Date();
  await memo.save();

  res.json(memo);
});

// Archive memo
const archiveMemo = asyncHandler(async (req, res) => {
  const { memoId } = req.params;
  const memo = await Memo.findById(memoId);

  if (!memo) {
    res.status(404);
    throw new Error("Memo not found");
  }

  if (
    memo.sender.toString() !== req.user._id.toString() &&
    req.user.role !== "Admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to archive this memo");
  }

  memo.status.set("archived", { status: "archived", timestamp: new Date() });
  await memo.save();

  res.json(memo);
});

export { createMemo, getMemos, getMemoById, updateMemoStatus, archiveMemo };
