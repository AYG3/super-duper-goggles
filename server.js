import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/users.route.js";
import memoRoutes from "./routes/memos.routes.js";
import fieldRoutes from "./routes/fields.route.js";

dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// Configure CORS
// app.use(cors({
//   origin: "*"
// }));

app.use(cors({
  // origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Allow both localhost variations
  origin: '*', // Allow both localhost variations
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/memos", memoRoutes);
app.use("/api/fields", fieldRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
