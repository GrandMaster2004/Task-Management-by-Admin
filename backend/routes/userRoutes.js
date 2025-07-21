const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Register user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
    })

    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    })
  }
})

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    })
  }
})

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get user information",
      error: error.message,
    })
  }
})

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email } = req.body

    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true })

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    })
  }
})

module.exports = router
