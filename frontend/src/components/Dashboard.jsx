"use client";
import { useState, useEffect } from "react";
import {
  Home,
  Clock,
  CheckCircle,
  BarChart3,
  Settings,
  MoreHorizontal,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // Import useTheme
import apiService from "../services/api";
import TaskModal from "./TaskModal";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Use theme context
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      console.log("Fetching tasks...");
      const response = await apiService.getTasks();
      console.log("Tasks response:", response);
      if (response.success) {
        setTasks(response.tasks || []);
        setError(null);
      } else {
        console.error("Failed to fetch tasks:", response.message);
        setTasks([]);
        setError(response.message || "Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Removed handleCreateTask as users cannot create tasks themselves
  const handleUpdateTask = async (taskId, taskData) => {
    try {
      console.log("Updating task:", taskId, "with data:", taskData);
      const response = await apiService.updateTask(taskId, taskData);
      console.log("Update task response:", response);
      if (response.success && response.task) {
        setTasks(
          tasks.map((task) => (task._id === taskId ? response.task : task))
        );
        setShowTaskModal(false);
        setSelectedTask(null);
        setError(null);
      } else {
        console.error("Failed to update task:", response.message);
        setError(response.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      setError(error.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      console.log("Deleting task:", taskId);
      const response = await apiService.deleteTask(taskId);
      console.log("Delete task response:", response);
      if (response.success) {
        setTasks(tasks.filter((task) => task._id !== taskId));
        setShowTaskModal(false);
        setSelectedTask(null);
        setError(null);
      } else {
        console.error("Failed to delete task:", response.message);
        setError(response.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      setError(error.message);
    }
  };

  const handleToggleComplete = async (taskId, completed) => {
    try {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;
      const updatedTaskData = {
        ...task,
        completed: completed,
      };
      await handleUpdateTask(taskId, updatedTaskData);
    } catch (error) {
      console.error("Failed to toggle task completion:", error);
      setError(error.message);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleSidebarNavigation = (view) => {
    setActiveView(view);
    setSidebarOpen(false);
    if (view === "pending") {
      setActiveFilter("Pending");
    } else if (view === "completed") {
      setActiveFilter("Completed");
    } else {
      setActiveFilter("All");
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const lowPriority = tasks.filter((task) => task.priority === "Low").length;
    const mediumPriority = tasks.filter(
      (task) => task.priority === "Medium"
    ).length;
    const highPriority = tasks.filter(
      (task) => task.priority === "High"
    ).length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      pending,
      lowPriority,
      mediumPriority,
      highPriority,
      completionRate,
    };
  };

  const stats = getTaskStats();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Low":
        return "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900";
      case "Medium":
        return "text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900";
      case "High":
        return "text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700";
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    if (activeView === "pending") {
      filtered = tasks.filter((task) => !task.completed);
    } else if (activeView === "completed") {
      filtered = tasks.filter((task) => task.completed);
    }
    if (
      activeFilter === "All" ||
      activeFilter === "Pending" ||
      activeFilter === "Completed"
    ) {
      return filtered;
    }
    if (activeFilter === "Today") {
      return filtered.filter((task) => {
        if (!task.dueDate) return false;
        return (
          new Date(task.dueDate).toDateString() === new Date().toDateString()
        );
      });
    }
    if (activeFilter === "Week") {
      return filtered.filter((task) => {
        if (!task.dueDate) return false;
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return new Date(task.dueDate) <= weekFromNow;
      });
    }
    return filtered.filter((task) => task.priority === activeFilter);
  };

  const filteredTasks = getFilteredTasks();

  const getPageTitle = () => {
    switch (activeView) {
      case "pending":
        return "Pending Tasks";
      case "completed":
        return "Completed Tasks";
      default:
        return "Task Overview";
    }
  };

  const getPageDescription = () => {
    switch (activeView) {
      case "pending":
        return `You have ${stats.pending} pending tasks to complete`;
      case "completed":
        return `You have completed ${stats.completed} tasks`;
      default:
        return "Manage your tasks efficiently";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading your tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                TaskFlow
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                  Hey, {user?.name}
                </p>
                <p className="text-sm text-purple-500">
                  🚀 Let's crush some tasks!
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              PRODUCTIVITY
            </div>
            <div className="text-2xl font-bold text-purple-500">
              {stats.completionRate}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => handleSidebarNavigation("dashboard")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === "dashboard"
                  ? "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-200"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <Home size={20} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleSidebarNavigation("pending")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === "pending"
                  ? "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-200"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <Clock size={20} />
              <span>Pending Tasks</span>
              <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full dark:bg-orange-900 dark:text-orange-200">
                {stats.pending}
              </span>
            </button>
            <button
              onClick={() => handleSidebarNavigation("completed")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === "completed"
                  ? "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-200"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <CheckCircle size={20} />
              <span>Completed Tasks</span>
              <span className="ml-auto bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-200">
                {stats.completed}
              </span>
            </button>
          </nav>

          {/* Dark Mode Toggle */}
          <div className="mt-8">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </button>
          </div>

          <div className="mt-2 p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
              Pro Tip
            </h3>
            <p className="text-sm text-purple-600 dark:text-purple-300 mb-3">
              Use keyboard shortcuts to boost productivity!
            </p>
            <a href="#" className="text-sm text-purple-500 underline">
              Visit Hexagon Digital Services
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 p-4 lg:p-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                TaskFlow
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0)}
                </span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      {user?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                {activeView === "dashboard" && (
                  <Home className="mr-2" size={24} />
                )}
                {activeView === "pending" && (
                  <Clock className="mr-2" size={24} />
                )}
                {activeView === "completed" && (
                  <CheckCircle className="mr-2" size={24} />
                )}
                {getPageTitle()}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {getPageDescription()}
              </p>
            </div>
            {/* Removed "Add New Task" button for regular users */}
          </div>

          {/* Stats Cards - Only show on dashboard */}
          {activeView === "dashboard" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {stats.total}
                    </p>
                    <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300">
                      Total Tasks
                    </p>
                  </div>
                  <Home className="text-purple-500" size={20} />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.lowPriority}
                    </p>
                    <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300">
                      Low Priority
                    </p>
                  </div>
                  <div className="w-5 h-5 lg:w-6 lg:h-6 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl lg:text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.mediumPriority}
                    </p>
                    <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300">
                      Medium Priority
                    </p>
                  </div>
                  <div className="w-5 h-5 lg:w-6 lg:h-6 bg-orange-100 rounded-full flex items-center justify-center dark:bg-orange-900">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-orange-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">
                      {stats.highPriority}
                    </p>
                    <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300">
                      High Priority
                    </p>
                  </div>
                  <div className="w-5 h-5 lg:w-6 lg:h-6 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-red-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              Filter:
            </span>
            <div className="flex flex-wrap gap-2">
              {activeView === "dashboard"
                ? ["All", "Today", "Week", "High", "Medium", "Low"].map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          activeFilter === filter
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {filter}
                      </button>
                    )
                  )
                : ["All", "Today", "Week", "High", "Medium", "Low"].map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          activeFilter === filter
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {filter}
                      </button>
                    )
                  )}
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeView === "pending" && (
                    <Clock className="w-8 h-8 text-gray-400" />
                  )}
                  {activeView === "completed" && (
                    <CheckCircle className="w-8 h-8 text-gray-400" />
                  )}
                  {activeView === "dashboard" && (
                    <Home className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {activeView === "pending" && "No pending tasks"}
                  {activeView === "completed" && "No completed tasks"}
                  {activeView === "dashboard" && "No tasks found"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {activeView === "pending" && "Great! You're all caught up."}
                  {activeView === "completed" &&
                    "Complete some tasks to see them here."}
                  {activeView === "dashboard" &&
                    "Your tasks will appear here once assigned by an Admin."}
                </p>
                {/* Removed "Add New Task" button from empty state */}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start sm:items-center justify-between space-x-4">
                    <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) =>
                          handleToggleComplete(task._id, e.target.checked)
                        }
                        className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500 mt-1 sm:mt-0 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium text-sm sm:text-base ${
                            task.completed
                              ? "line-through text-gray-500 dark:text-gray-400"
                              : "text-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2 sm:hidden">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                      className="sm:hidden text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Removed "Add New Task" button at the bottom */}
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <div className="hidden xl:block w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Task Statistics
            </h2>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <Settings size={20} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      {user?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-1">
                {stats.total}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Total Tasks
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-1">
                {stats.completed}
              </div>
              <div className="text-gray-600 dark:text-gray-300">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-1">
                {stats.pending}
              </div>
              <div className="text-gray-600 dark:text-gray-300">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-1">
                {stats.completionRate}%
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Completion Rate
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                <Clock className="mr-2" size={16} />
                Task Progress
              </h3>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full"
                  style={{ width: `${stats.completionRate}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-600 dark:text-gray-300 mt-1">
                {stats.completed}/{stats.total}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                <Clock className="mr-2" size={16} />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        task.completed
                          ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200"
                          : "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200"
                      }`}
                    >
                      {task.completed ? "Done" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Removed Mobile FAB */}
      {/* Task Modal - Only for editing existing tasks */}
      {selectedTask && showTaskModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={(taskData) => handleUpdateTask(selectedTask._id, taskData)} // Always update
          onDelete={() => handleDeleteTask(selectedTask._id)} // Always delete
        />
      )}
    </div>
  );
};

export default Dashboard;
