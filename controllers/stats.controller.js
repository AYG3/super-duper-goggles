import asyncHandler from "express-async-handler";
import Memo from "../models/Memo.js";

// Get user statistics
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  try {
    // Get all memos where user is either sender or recipient
    const sentMemos = await Memo.find({ sender: userId });
    const receivedMemos = await Memo.find({
      $or: [
        { recipients: userId },
        { department: req.user.department }
      ]
    });
    
    // Calculate total memos (sent + received, avoiding duplicates)
    const allMemoIds = new Set();
    sentMemos.forEach(memo => allMemoIds.add(memo._id.toString()));
    receivedMemos.forEach(memo => allMemoIds.add(memo._id.toString()));
    const totalMemos = allMemoIds.size;
    
    // Calculate memos sent by this user
    const memosSent = sentMemos.length;
    
    // Calculate archived memos (memos where status contains "archived")
    const archivedMemos = await Memo.find({
      $or: [
        { sender: userId },
        { recipients: userId },
        { department: req.user.department }
      ],
      "status.archived": { $exists: true }
    });
    const memosArchived = archivedMemos.length;
    
    const stats = {
      totalMemos,
      memosSent,
      memosArchived
    };
    
    res.json({
      success: true,
      data: stats,
      message: "User statistics retrieved successfully"
    });
    
  } catch (error) {
    console.error("Error calculating user stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate user statistics",
      message: error.message
    });
  }
});

export { getUserStats };