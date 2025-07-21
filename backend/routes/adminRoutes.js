const express = require("express")
const User = require("../models/User")
const Task = require("../models/Task")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Get all users
router.get("/users", auth, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    })
  }
})

// Create new user
router.post("/users", auth, authorize("admin"), async (req, res) => {
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

    const user = new User({
      name,
      email,
      password,
      role,
      createdBy: req.user._id,
    })

    await user.save()

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    })
  } catch (error) {
    console.error("Create user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    })
  }
})

// Update user
router.put("/users/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const { name, email, role, password } = req.body

    const updateData = { name, email, role }
    if (password) {
      updateData.password = password
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    })
  }
})

// Delete user
router.delete("/users/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      })
    }

    // Delete user's tasks
    await Task.deleteMany({
      $or: [{ createdBy: req.params.id }, { assignedTo: req.params.id }],
    })

    await User.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    })
  }
})

// Get all subadmins
router.get("/subadmins", auth, authorize("admin"), async (req, res) => {
  try {
    const subAdmins = await User.find({ role: "subadmin" }).select("-password").sort({ createdAt: -1 })

    res.json({
      success: true,
      subAdmins,
    })
  } catch (error) {
    console.error("Get subadmins error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch subadmins",
      error: error.message,
    })
  }
})

// Create subadmin
router.post("/subadmins", auth, authorize("admin"), async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    const subAdmin = new User({
      name,
      email,
      password,
      role: "subadmin",
      createdBy: req.user._id,
    })

    await subAdmin.save()

    res.status(201).json({
      success: true,
      message: "SubAdmin created successfully",
      subAdmin,
    })
  } catch (error) {
    console.error("Create subadmin error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create subadmin",
      error: error.message,
    })
  }
})

// Update subadmin permissions
router.put("/subadmins/:id/permissions", auth, authorize("admin"), async (req, res) => {
  try {
    const { viewUsers, editUsers, canViewAllTasks, canEditAllTasks } = req.body

    const subAdmin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "subadmin" },
      {
        permissions: {
          viewUsers: viewUsers || [],
          editUsers: editUsers || [],
          canViewAllTasks: canViewAllTasks || false,
          canEditAllTasks: canEditAllTasks || false,
        },
      },
      { new: true, runValidators: true },
    )

    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        message: "SubAdmin not found",
      })
    }

    res.json({
      success: true,
      message: "Permissions updated successfully",
      subAdmin,
    })
  } catch (error) {
    console.error("Update permissions error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update permissions",
      error: error.message,
    })
  }
})

// Assign task to user
router.post("/assign-task", auth, authorize("admin"), async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo } = req.body

    const task = new Task({
      title,
      description,
      priority,
      dueDate,
      createdBy: req.user._id,
      assignedTo,
    })

    await task.save()
    await task.populate("createdBy", "name email")
    await task.populate("assignedTo", "name email")

    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      task,
    })
  } catch (error) {
    console.error("Assign task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to assign task",
      error: error.message,
    })
  }
})

// Get all tasks (admin view)
router.get("/tasks", auth, authorize("admin"), async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      tasks,
    })
  } catch (error) {
    console.error("Get all tasks error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    })
  }
})

module.exports = router
