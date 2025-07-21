const express = require("express")
const Task = require("../models/Task")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Get user's tasks
router.get("/gp", auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user._id,
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      tasks,
    })
  } catch (error) {
    console.error("Get tasks error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    })
  }
})

// Create new task
router.post("/gp", auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo } = req.body

    const task = new Task({
      title,
      description,
      priority,
      dueDate,
      createdBy: req.user._id,
      assignedTo: assignedTo || req.user._id,
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

// Get single task
router.get("/:id/gp", auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    res.json({
      success: true,
      task,
    })
  } catch (error) {
    console.error("Get task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch task",
      error: error.message,
    })
  }
})

// Update task
router.post("/:id/gp", auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate, completed, assignedTo } = req.body

    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Update task fields
    task.title = title || task.title
    task.description = description !== undefined ? description : task.description
    task.priority = priority || task.priority
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate
    task.completed = completed !== undefined ? completed : task.completed
    task.assignedTo = assignedTo || task.assignedTo

    await task.save()
    await task.populate("createdBy", "name email")
    await task.populate("assignedTo", "name email")

    res.json({
      success: true,
      message: "Task updated successfully",
      task,
    })
  } catch (error) {
    console.error("Update task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    })
  }
})

// Delete task
router.delete("/:id/gp", auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    await Task.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Task deleted successfully",
    })
  } catch (error) {
    console.error("Delete task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    })
  }
})

module.exports = router
