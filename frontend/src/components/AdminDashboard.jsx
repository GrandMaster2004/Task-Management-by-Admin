"use client";

import { useState, useEffect } from "react";
import {
  Home,
  Clock,
  CheckCircle,
  BarChart3,
  Users,
  UserPlus,
  UserX,
  Edit,
  Trash2,
  Menu,
  X,
  LogOut,
  UserCheck,
  UserMinus,
  Sun,
  Moon,
  Settings,
  Mail,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import apiService from "../services/api";
import TaskModal from "./TaskModal";
import UserModal from "./UserModal";
import TaskAssignModal from "./TaskAssignModal"; // This will now be for "Assign New Task"
import SubAdminModal from "./SubAdminModal";
import PermissionModal from "./PermissionModal";
import EmailModal from "./EmailModal";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false); // For editing existing tasks
  const [selectedTask, setSelectedTask] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showTaskAssignModal, setShowTaskAssignModal] = useState(false); // For assigning NEW tasks from sidebar
  const [showSubAdminModal, setShowSubAdminModal] = useState(false);
  const [subAdminToEdit, setSubAdminToEdit] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [userToManagePermissions, setUserToManagePermissions] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [usersToEmail, setUsersToEmail] = useState([]);

  // View states
  const [activeView, setActiveView] = useState("overview"); // overview, manage-tasks, manage-users, unassigned-users
  const [activeTimeline, setActiveTimeline] = useState("all"); // all, today, week, month, completed, pending, assigned, deadline-missed

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksResponse, usersResponse] = await Promise.all([
        apiService.getAllTasks(),
        apiService.getAllUsers(),
      ]);

      if (tasksResponse.success) {
        setTasks(tasksResponse.tasks);
      } else {
        setError(tasksResponse.message || "Failed to fetch tasks");
      }

      if (usersResponse.success) {
        setUsers(usersResponse.users);
      } else {
        setError(usersResponse.message || "Failed to fetch users");
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // This function will be used by TaskModal for creating/updating tasks
  const handleSaveTask = async (taskData, taskId = null) => {
    try {
      let response;
      if (taskId) {
        response = await apiService.updateTask(taskId, taskData);
      } else {
        response = await apiService.createTask(taskData);
      }

      if (response.success && response.task) {
        if (taskId) {
          setTasks(
            tasks.map((task) => (task._id === taskId ? response.task : task))
          );
        } else {
          setTasks([...tasks, response.task]);
        }
        setShowTaskModal(false);
        setSelectedTask(null);
        setError(null);
      } else {
        setError(
          response.message || `Failed to ${taskId ? "update" : "create"} task`
        );
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // This function will be used by TaskAssignModal for creating and assigning NEW tasks
  const handleCreateAndAssignTask = async (taskData) => {
    try {
      const response = await apiService.createTask(taskData); // createTask now handles assignment
      if (response.success && response.task) {
        setTasks([...tasks, response.task]);
        setShowTaskAssignModal(false);
        setError(null);
      } else {
        setError(response.message || "Failed to create and assign task");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        const response = await apiService.deleteTask(taskId);
        if (response.success) {
          setTasks(tasks.filter((task) => task._id !== taskId));
          setShowTaskModal(false);
          setSelectedTask(null);
          setError(null);
        } else {
          setError(response.message || "Failed to delete task");
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const response = await apiService.register(userData);
      if (response.success && response.user) {
        setUsers([...users, response.user]);
        setShowUserModal(false);
        setError(null);
      } else {
        setError(response.message || "Failed to create user");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      const response = await apiService.updateUser(userId, userData);
      if (response.success && response.user) {
        setUsers(users.map((u) => (u._id === userId ? response.user : u)));
        setShowUserModal(false);
        setSelectedUser(null);
        setError(null);
      } else {
        setError(response.message || "Failed to update user");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await apiService.deleteUser(userId);
        if (response.success) {
          setUsers(users.filter((u) => u._id !== userId));
          setShowUserModal(false);
          setSelectedUser(null);
          setError(null);
        } else {
          setError(response.message || "Failed to delete user");
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleRemoveTaskAssignment = async (taskId) => {
    if (window.confirm("Are you sure you want to unassign this task?")) {
      try {
        const response = await apiService.unassignTask(taskId);
        if (response.success && response.task) {
          setTasks(
            tasks.map((task) => (task._id === taskId ? response.task : task))
          );
          setError(null);
        } else {
          setError(response.message || "Failed to unassign task");
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Modified: handleCreateSubAdmin now promotes an existing user
  const handlePromoteToSubAdmin = async (userId) => {
    try {
      const response = await apiService.promoteToSubAdmin(userId);
      if (response.success && response.user) {
        setUsers(users.map((u) => (u._id === userId ? response.user : u)));
        setShowSubAdminModal(false);
        setError(null);
      } else {
        setError(response.message || "Failed to promote user to sub-admin");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // New: handle demote sub-admin
  const handleDemoteSubAdmin = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to demote this sub-admin to a regular user?"
      )
    ) {
      try {
        const response = await apiService.demoteSubAdmin(userId);
        if (response.success && response.user) {
          setUsers(users.map((u) => (u._id === userId ? response.user : u)));
          setError(null);
        } else {
          setError(response.message || "Failed to demote sub-admin");
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleUpdatePermissions = async (userId, permissions) => {
    try {
      const response = await apiService.updateSubAdminPermissions(
        userId,
        permissions
      );
      if (response.success && response.user) {
        setUsers(users.map((u) => (u._id === userId ? response.user : u)));
        setShowPermissionModal(false);
        setUserToManagePermissions(null);
        setError(null);
      } else {
        setError(response.message || "Failed to update permissions");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendEmail = async (recipients, subject, message) => {
    try {
      const response = await apiService.sendEmail({
        recipients,
        subject,
        message,
      });
      if (response.success) {
        setError("Email sent successfully!");
        setShowEmailModal(false);
        setUsersToEmail([]);
      } else {
        setError(response.message || "Failed to send email");
      }
    } catch (err) {
      setError(err.message || "An error occurred while sending email.");
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const getStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const totalUsers = users.length;
    const unassignedUsers = users.filter(
      (u) =>
        u.role === "user" &&
        !tasks.some((task) => task.assignedTo?._id === u._id)
    ).length;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      totalUsers,
      unassignedUsers,
    };
  };

  const stats = getStats();

  const getTimelineData = () => {
    let filtered = tasks;

    if (activeTimeline === "today") {
      filtered = tasks.filter((task) => {
        if (!task.dueDate) return false;
        return (
          new Date(task.dueDate).toDateString() === new Date().toDateString()
        );
      });
    } else if (activeTimeline === "week") {
      filtered = tasks.filter((task) => {
        if (!task.dueDate) return false;
        const oneWeek = new Date();
        oneWeek.setDate(oneWeek.getDate() + 7);
        return new Date(task.dueDate) <= oneWeek;
      });
    } else if (activeTimeline === "month") {
      filtered = tasks.filter((task) => {
        if (!task.dueDate) return false;
        const oneMonth = new Date();
        oneMonth.setMonth(oneMonth.getMonth() + 1);
        return new Date(task.dueDate) <= oneMonth;
      });
    } else if (activeTimeline === "completed") {
      filtered = tasks.filter((task) => task.completed);
    } else if (activeTimeline === "pending") {
      filtered = tasks.filter((task) => !task.completed);
    } else if (activeTimeline === "assigned") {
      filtered = tasks.filter((task) => task.assignedTo);
    } else if (activeTimeline === "deadline-missed") {
      const now = new Date();
      filtered = tasks.filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate < now && !task.completed;
      });
    }

    return filtered;
  };

  const handleTimelineClick = (type) => {
    setActiveTimeline(type);
  };

  const getFilteredUsers = () => {
    if (activeView === "unassigned-users") {
      const assignedUserIds = new Set(
        tasks
          .filter((task) => task.assignedTo)
          .map((task) => task.assignedTo._id)
      );
      return users.filter(
        (u) => u.role === "user" && !assignedUserIds.has(u._id)
      );
    }
    return users;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Error Notification */}
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
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
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
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {user?.name}
                </p>
                <p className="text-sm text-purple-500">Admin</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveView("overview")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === "overview"
                  ? "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-200"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <Home size={20} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveView("manage-tasks")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === "manage-tasks"
                  ? "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-200"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <BarChart3 size={20} />
              <span>Manage Tasks</span>
            </button>
            <button
              onClick={() => setActiveView("manage-users")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === "manage-users"
                  ? "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-200"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <Users size={20} />
              <span>Manage Users</span>
            </button>
            {/* New: Assign New Task button in sidebar */}
            <button
              onClick={() => setShowTaskAssignModal(true)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                showTaskAssignModal
                  ? "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-200"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <PlusCircle size={20} />
              <span>Assign New Task</span>
            </button>
          </nav>

          <div className="mt-8">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </button>
          </div>

          <div className="mt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Admin Dashboard
          </h1>
          <div className="w-6"></div>
        </div>

        {/* Overview Content */}
        {activeView === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Overview
            </h2>
            {/* Stats Cards - Redefined Order */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Tasks */}
              <div
                onClick={() => setActiveView("manage-tasks")}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {stats.totalTasks}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Total Tasks
                    </p>
                  </div>
                  <BarChart3 className="text-purple-500" size={20} />
                </div>
              </div>

              {/* Pending Tasks */}
              <div
                onClick={() => handleTimelineClick("pending")}
                className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                  activeTimeline === "pending"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.pendingTasks}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Pending Tasks
                    </p>
                  </div>
                  <Clock className="text-orange-500" size={20} />
                </div>
              </div>

              {/* Completed Tasks */}
              <div
                onClick={() => handleTimelineClick("completed")}
                className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                  activeTimeline === "completed"
                    ? "border-green-500 bg-green-50 dark:bg-green-900"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {stats.completedTasks}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Completed Tasks
                    </p>
                  </div>
                  <CheckCircle className="text-green-500" size={20} />
                </div>
              </div>

              {/* Total Users */}
              <div
                onClick={() => setActiveView("manage-users")}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.totalUsers}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Total Users
                    </p>
                  </div>
                  <Users className="text-blue-500" size={20} />
                </div>
              </div>

              {/* Unassigned Users */}
              <div
                onClick={() => setActiveView("unassigned-users")}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {stats.unassignedUsers}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Unassigned Users
                    </p>
                  </div>
                  <UserX className="text-red-500" size={20} />
                </div>
              </div>
            </div>

            {/* Timeline Bar */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {activeTimeline === "all" && "All Tasks Timeline"}
                  {activeTimeline === "today" && "Tasks Due Today"}
                  {activeTimeline === "week" && "Tasks Due This Week"}
                  {activeTimeline === "month" && "Tasks Due This Month"}
                  {activeTimeline === "completed" && "Completed Tasks Timeline"}
                  {activeTimeline === "pending" && "Pending Tasks Timeline"}
                  {activeTimeline === "assigned" && "Assigned Tasks Timeline"}
                  {activeTimeline === "deadline-missed" &&
                    "Deadline Missed Tasks"}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {getTimelineData().length} items
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getTimelineData().map((task, index) => (
                  <div
                    key={task._id}
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskModal(true);
                    }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Assigned to: {task.assignedTo?.name || "Unassigned"}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === "High"
                            ? "bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-100"
                            : task.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-100"
                            : "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-100"
                        }`}
                      >
                        {task.priority || "Low"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.completed
                            ? "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-100"
                            : "bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-100"
                        }`}
                      >
                        {task.completed ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
                {getTimelineData().length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No tasks found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manage Tasks Content */}
        {activeView === "manage-tasks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Manage Tasks
              </h2>
              {/* Removed "Add New Task" button */}
            </div>

            {/* Filter Tabs for Tasks */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                Filter Tasks:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "all",
                  "today",
                  "week",
                  "month",
                  "completed",
                  "pending",
                  "deadline-missed",
                ].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleTimelineClick(filter)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      activeTimeline === filter
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() +
                      filter.slice(1).replace("-", " ")}
                  </button>
                ))}
                {activeTimeline === "deadline-missed" &&
                  getTimelineData().length > 0 && (
                    <button
                      onClick={() => {
                        setUsersToEmail(
                          getTimelineData()
                            .map((task) => task.assignedTo)
                            .filter(Boolean)
                        );
                        setShowEmailModal(true);
                      }}
                      className="px-3 py-1 rounded-full text-sm transition-colors bg-red-500 text-white hover:bg-red-600 flex items-center space-x-1"
                    >
                      <Mail size={16} />
                      <span>Email Users</span>
                    </button>
                  )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                {activeTimeline === "deadline-missed"
                  ? "Deadline Missed Tasks"
                  : "All Tasks"}{" "}
                ({getTimelineData().length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getTimelineData().length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No tasks found.
                  </div>
                ) : (
                  getTimelineData().map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {task.title.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {task.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Assigned to: {task.assignedTo?.name || "Unassigned"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Due:{" "}
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {/* Removed individual "Assign Task" button */}
                        {task.assignedTo && (
                          <button
                            onClick={() => handleRemoveTaskAssignment(task._id)}
                            className="text-orange-500 hover:text-orange-700"
                            title="Unassign Task"
                          >
                            <UserMinus size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit Task"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete Task"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manage Users Content */}
        {activeView === "manage-users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Manage Users
              </h2>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setShowUserModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <UserPlus size={16} />
                <span>Add New User</span>
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                All Users ({users.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No users found.
                  </div>
                ) : (
                  users.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {u.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {u.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {u.email}
                          </p>
                          <p className="text-xs text-blue-500">{u.role}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {u.role === "user" && (
                          <button
                            onClick={() => {
                              setSubAdminToEdit(u); // Pass the user object to the modal for promotion
                              setShowSubAdminModal(true);
                            }}
                            className="text-purple-500 hover:text-purple-700"
                            title="Make Sub-Admin"
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                        {u.role === "subadmin" && (
                          <>
                            <button
                              onClick={() => handleDemoteSubAdmin(u._id)}
                              className="text-orange-500 hover:text-orange-700"
                              title="Demote Sub-Admin"
                            >
                              <UserMinus size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setUserToManagePermissions(u);
                                setShowPermissionModal(true);
                              }}
                              className="text-yellow-500 hover:text-yellow-700"
                              title="Manage Permissions"
                            >
                              <Settings size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowUserModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Unassigned Users Content */}
        {activeView === "unassigned-users" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Unassigned Users
            </h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Users Without Assigned Tasks ({getFilteredUsers().length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getFilteredUsers().length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    All users have tasks assigned!
                  </div>
                ) : (
                  getFilteredUsers().map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {u.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {u.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowUserModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal (for editing existing tasks) */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={handleSaveTask} // Use the unified save handler
          onDelete={
            selectedTask ? () => handleDeleteTask(selectedTask._id) : undefined
          }
          users={users.filter((u) => u.role === "user")} // Only allow assigning to regular users
        />
      )}

      {/* Task Assign Modal (for creating and assigning NEW tasks from sidebar) */}
      {showTaskAssignModal && (
        <TaskAssignModal
          task={null} // Always null for new task creation
          users={users.filter((u) => u.role === "user")} // Only allow assigning to regular users
          onClose={() => {
            setShowTaskAssignModal(false);
          }}
          onAssign={handleCreateAndAssignTask} // Use the new create and assign handler
        />
      )}

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={selectedUser ? handleUpdateUser : handleCreateUser}
          onDelete={
            selectedUser ? () => handleDeleteUser(selectedUser._id) : undefined
          }
        />
      )}

      {/* SubAdmin Modal */}
      {showSubAdminModal && (
        <SubAdminModal
          userToPromote={subAdminToEdit} // Pass the user object for promotion/editing
          users={users.filter((u) => u.role === "user")} // Only show regular users for promotion
          onClose={() => {
            setShowSubAdminModal(false);
            setSubAdminToEdit(null);
          }}
          onPromote={handlePromoteToSubAdmin}
          onUpdate={handleUpdateUser} // Re-use update user for sub-admin details
        />
      )}

      {/* Permission Modal */}
      {showPermissionModal && userToManagePermissions && (
        <PermissionModal
          subAdmin={userToManagePermissions}
          users={users.filter((u) => u.role === "user")} // Pass all regular users for specific permissions
          onClose={() => {
            setShowPermissionModal(false);
            setUserToManagePermissions(null);
          }}
          onSave={handleUpdatePermissions}
        />
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <EmailModal
          recipients={usersToEmail}
          onClose={() => setShowEmailModal(false)}
          onSend={handleSendEmail}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
