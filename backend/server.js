const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")

// Import routes
const userRoutes = require("./routes/userRoutes")
const taskRoutes = require("./routes/taskRoutes")
const adminRoutes = require("./routes/adminRoutes")
const subAdminRoutes = require("./routes/subAdminRoutes")

dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/taskflow", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes
app.use("/api/user", userRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/subadmin", subAdminRoutes)

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "TaskFlow API is running!" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
