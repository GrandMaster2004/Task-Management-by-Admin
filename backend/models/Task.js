const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    dueDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Update completedAt when task is marked as completed
taskSchema.pre("save", function (next) {
  if (this.isModified("completed")) {
    if (this.completed) {
      this.completedAt = new Date()
    } else {
      this.completedAt = undefined
    }
  }
  next()
})

module.exports = mongoose.model("Task", taskSchema)
