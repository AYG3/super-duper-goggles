import mongoose from "mongoose";

const memoSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  department: { type: String }, // Optional: Target entire department
  content: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },
  status: {
    type: Map,
    of: {
      status: {
        type: String,
        enum: ["sent", "delivered", "read", "acknowledged", "recieved"],
        default: "sent",
      },
      timestamp: { type: Date, default: Date.now },
    },
  },
  responses: {
    type: Map,
    of: {
      reply: { type: String, default: "" },
      approved: { type: Boolean, default: false },
      timestamp: { type: Date },
    },
    default: undefined,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Memo", memoSchema);