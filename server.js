import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // Added cors
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/users.route.js";
import memoRoutes from "./routes/memos.routes.js";
import fieldRoutes from "./routes/fields.route.js";
import statsRoutes from "./routes/stats.route.js";

dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// Middleware

// CORS Configuration - FIXED
const corsOptions = {
  origin: [
    'http://localhost:3000',  // Next.js frontend
    'http://127.0.0.1:3000',  // Alternative localhost
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/memos", memoRoutes);
app.use("/api/fields", fieldRoutes);
app.use("/api/stats", statsRoutes);

// Add health check endpoint for diagnostics
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
