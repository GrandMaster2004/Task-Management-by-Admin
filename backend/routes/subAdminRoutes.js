const express = require("express")
const User = require("../models/User")
const Task = require("../models/Task")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Get accessible users for subadmin
router.get("/users", auth, authorize("subadmin"), async (req, res) => {
  try {
    const subAdmin = await User.findById(req.user._id)

    if (!subAdmin.permissions.viewUsers || subAdmin.permissions.viewUsers.length === 0) {
      return res.json({
        success: true,
        users: [],
      })
    }

    const users = await User.find({
      _id: { $in: subAdmin.permissions.viewUsers },
    }).select("-password")

    // Add permission flags to each user
    const usersWithPermissions = users.map((user) => ({
      ...user.toObject(),
      canView: subAdmin.permissions.viewUsers.includes(user._id),
      canEdit: subAdmin.permissions.editUsers.includes(user._id),
    }))

    res.json({
      success: true,
      users: usersWithPermissions,
    })
  } catch (error) {
    console.error("Get accessible users error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch accessible users",
      error: error.message,
    })
  }
})

// Get assigned tasks for subadmin
router.get("/tasks", auth, authorize("subadmin"), async (req, res) => {
  try {
    const subAdmin = await User.findById(req.user._id)
    let tasks = []

    if (subAdmin.permissions.canViewAllTasks) {
      // Can view all tasks
      tasks = await Task.find()
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
    } else {
      // Can only view tasks assigned to them or created by them
      tasks = await Task.find({
        $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
      })
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
    }

    res.json({
      success: true,
      tasks,
    })
  } catch (error) {
    console.error("Get assigned tasks error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned tasks",
      error: error.message,
    })
  }
})

// Update user (if subadmin has edit permission)
router.put("/users/:id", auth, authorize("subadmin"), async (req, res) => {
  try {
    const subAdmin = await User.findById(req.user._id)

    // Check if subadmin has edit permission for this user
    if (!subAdmin.permissions.editUsers.includes(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit this user",
      })
    }

    const { name, email } = req.body

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true, runValidators: true },
    ).select("-password")

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

// Create task (if subadmin has permission)
router.post("/tasks", auth, authorize("subadmin"), async (req, res) => {
  try {
    const subAdmin = await User.findById(req.user._id)

    if (!subAdmin.permissions.canEditAllTasks) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create tasks",
      })
    }

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
      message: "Task created successfully",
      task,
    })
  } catch (error) {
    console.error("Create task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message,
    })
  }
})

module.exports = router
