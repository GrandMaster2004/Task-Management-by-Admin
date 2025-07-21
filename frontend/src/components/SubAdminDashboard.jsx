"use client";

import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  Clock,
  Menu,
  X,
  LogOut,
  Home,
  PlusCircle,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Mail,
  ListTodo,
  UserX,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";
import TaskModal from "./TaskModal";
import TaskAssignModal from "./TaskAssignModal";
import UserModal from "./UserModal";
import EmailModal from "./EmailModal";
import { format } from "date-fns";

const SubAdminDashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskAssignModal, setShowTaskAssignModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState([]);

  // Task filtering
  const [activeTimeline, setActiveTimeline] = useState("all"); // all, today, week, month, deadline-missed
  const [activeTaskFilter, setActiveTaskFilter] = useState("all"); // all, pending, completed

  const subAdminPermissions = user?.permissions || {};

  useEffect(() => {
    fetchData();
  }, [user, activeTimeline, activeTaskFilter]); // Re-fetch if user permissions change or filters change

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let fetchedUsers = [];
      let fetchedTasks = [];

      // Fetch users based on permissions
      if (subAdminPermissions.canViewAllUsers) {
        const usersRes = await apiService.getAllUsers();
        if (usersRes.success) {
          fetchedUsers = usersRes.users || [];
        } else {
          setError(usersRes.message);
        }
      } else if (subAdminPermissions.canViewSpecificUsers?.length > 0) {
        // If canViewSpecificUsers is defined and not empty, fetch only those users
        // This would require a backend endpoint like /subadmin/users?ids=...
        // For now, we'll filter from all users if we fetch them, or assume backend handles it.
        // If backend doesn't filter, we might need to fetch all and filter on frontend,
        // but that's less efficient for large datasets.
        const usersRes = await apiService.getAllUsers(); // Assuming backend filters based on subadmin token
        if (usersRes.success) {
          fetchedUsers = usersRes.users.filter((u) =>
            subAdminPermissions.canViewSpecificUsers.includes(u._id)
          );
        } else {
          setError(usersRes.message);
        }
      }

      // Fetch tasks based on permissions
      if (subAdminPermissions.canViewAllTasks) {
        const tasksRes = await apiService.getAllTasks();
        if (tasksRes.success) {
          fetchedTasks = tasksRes.tasks || [];
        } else {
          setError(tasksRes.message);
        }
      } else if (subAdminPermissions.canViewSpecificUsers?.length > 0) {
        // Fetch tasks assigned to users this subadmin can view
        // This would ideally be a specific backend endpoint for subadmins
        const tasksRes = await apiService.getAllTasks(); // Assuming backend filters based on subadmin token
        if (tasksRes.success) {
          fetchedTasks = tasksRes.tasks.filter((task) =>
            subAdminPermissions.canViewSpecificUsers.includes(
              task.assignedTo?._id || task.assignedTo
            )
          );
        } else {
          setError(tasksRes.message);
        }
      } else {
        // If no specific or global view permissions, subadmin can only see their own assigned tasks
        const tasksRes = await apiService.getTasks(); // This fetches tasks assigned to the current user (subadmin)
        if (tasksRes.success) {
          fetchedTasks = tasksRes.tasks || [];
        } else {
          setError(tasksRes.message);
        }
      }

      setUsers(fetchedUsers);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const totalUsers = users.length;
    const unassignedUsers = users.filter(
      (user) => !user.assignedTasks || user.assignedTasks.length === 0
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
    const now = new Date();
    let filteredTasks = tasks;

    if (activeTimeline === "today") {
      filteredTasks = filteredTasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate.toDateString() === now.toDateString();
      });
    } else if (activeTimeline === "week") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      filteredTasks = filteredTasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= startOfWeek && dueDate <= endOfWeek;
      });
    } else if (activeTimeline === "month") {
      filteredTasks = filteredTasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        return (
          dueDate.getMonth() === now.getMonth() &&
          dueDate.getFullYear() === now.getFullYear()
        );
      });
    } else if (activeTimeline === "deadline-missed") {
      filteredTasks = filteredTasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        return !task.completed && dueDate < now;
      });
    }

    if (activeTaskFilter === "pending") {
      filteredTasks = filteredTasks.filter((task) => !task.completed);
    } else if (activeTaskFilter === "completed") {
      filteredTasks = filteredTasks.filter((task) => task.completed);
    }

    return filteredTasks;
  };

  const filteredTasks = getTimelineData();

  const handleSaveTask = async (taskData, taskId = null) => {
    try {
      let response;
      if (taskId) {
        response = await apiService.updateTask(taskId, taskData);
      } else {
        response = await apiService.createTask(taskData);
      }
      if (response.success) {
        setError(null);
        setShowTaskModal(false);
        setEditingTask(null);
        fetchData(); // Refresh data
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to save task.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        const response = await apiService.deleteTask(taskId);
        if (response.success) {
          setError(null);
          fetchData(); // Refresh data
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message || "Failed to delete task.");
      }
    }
  };

  const handleAssignTask = async (taskId, userId) => {
    try {
      const response = await apiService.assignTask(taskId, userId);
      if (response.success) {
        setError(null);
        fetchData();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to assign task.");
    }
  };

  const handleUnassignTask = async (taskId) => {
    if (window.confirm("Are you sure you want to unassign this task?")) {
      try {
        const response = await apiService.unassignTask(taskId);
        if (response.success) {
          setError(null);
          fetchData();
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message || "Failed to unassign task.");
      }
    }
  };

  const handleCreateAndAssignTask = async (taskData) => {
    try {
      const response = await apiService.createTask(taskData); // This endpoint should handle assignment if assignedTo is present
      if (response.success) {
        setError(null);
        setShowTaskAssignModal(false);
        fetchData();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to create and assign task.");
    }
  };

  const handleSaveUser = async (userData, userId = null) => {
    try {
      let response;
      if (userId) {
        response = await apiService.updateUser(userId, userData);
      } else {
        response = await apiService.createUser(userData);
      }
      if (response.success) {
        setError(null);
        setShowUserModal(false);
        setEditingUser(null);
        fetchData(); // Refresh data
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to save user.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await apiService.deleteUser(userId);
        if (response.success) {
          setError(null);
          fetchData(); // Refresh data
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message || "Failed to delete user.");
      }
    }
  };

  const handleSendEmail = async (emailData) => {
    try {
      const response = await apiService.sendEmail(emailData);
      if (response.success) {
        setError(null);
        setShowEmailModal(false);
        alert("Email sent successfully!");
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || "Failed to send email.");
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalTasks}
              </p>
              <p className="text-gray-600 dark:text-gray-300">Total Tasks</p>
            </div>
            <ListTodo className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.pendingTasks}
              </p>
              <p className="text-gray-600 dark:text-gray-300">Pending Tasks</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completedTasks}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Completed Tasks
              </p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div
          className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          onClick={() =>
            subAdminPermissions.canViewAllUsers && setActiveView("manage-users")
          }
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalUsers}
              </p>
              <p className="text-gray-600 dark:text-gray-300">Total Users</p>
            </div>
            <Users className="text-purple-500" size={24} />
          </div>
        </div>
        <div
          className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          onClick={() =>
            subAdminPermissions.canViewAllUsers &&
            setActiveView("unassigned-users")
          }
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.unassignedUsers}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Unassigned Users
              </p>
            </div>
            <UserX className="text-red-500" size={24} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Recent Users
          </h3>
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => (
              <div key={user._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200"
                      : user.role === "subadmin"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Recent Tasks
          </h3>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Assigned to: {task.assignedTo?.name || "Unassigned"}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    task.completed
                      ? "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200"
                      : "bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-200"
                  }`}
                >
                  {task.completed ? "Completed" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderManageTasks = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Manage Tasks
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex space-x-2">
            {["all", "today", "week", "month", "deadline-missed"].map(
              (timeline) => (
                <button
                  key={timeline}
                  onClick={() => setActiveTimeline(timeline)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTimeline === timeline
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {timeline.charAt(0).toUpperCase() +
                    timeline.slice(1).replace("-", " ")}
                </button>
              )
            )}
          </div>
          <div className="flex space-x-2">
            {["all", "pending", "completed"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveTaskFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTaskFilter === filter
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          {activeTimeline === "deadline-missed" &&
            subAdminPermissions.canSendEmails && (
              <button
                onClick={() => {
                  const missedDeadlineUsers = filteredTasks
                    .filter((task) => task.assignedTo?.email)
                    .map((task) => task.assignedTo.email);
                  setEmailRecipients([...new Set(missedDeadlineUsers)]); // Unique emails
                  setShowEmailModal(true);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <Mail size={16} className="inline-block mr-2" />
                Email Users
              </button>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
        {filteredTasks.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300 text-center">
            No tasks found for this filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                {filteredTasks.map((task) => (
                  <tr key={task._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {task.assignedTo?.name || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {task.dueDate
                        ? format(new Date(task.dueDate), "PPP")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {task.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          task.completed
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100"
                        }`}
                      >
                        {task.completed ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(subAdminPermissions.canEditAllTasks ||
                        (task.assignedTo &&
                          subAdminPermissions.canEditSpecificUsers?.includes(
                            task.assignedTo._id
                          ))) && (
                        <>
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setShowTaskModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 mr-3"
                            title="Edit Task"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 mr-3"
                            title="Delete Task"
                          >
                            <Trash2 size={18} />
                          </button>
                          {task.assignedTo && (
                            <button
                              onClick={() => handleUnassignTask(task._id)}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-200"
                              title="Unassign Task"
                            >
                              <UserMinus size={18} />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderManageUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Manage Users
        </h2>
        {subAdminPermissions.canEditAllUsers && (
          <button
            onClick={() => {
              setEditingUser(null);
              setShowUserModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <UserPlus size={16} className="inline-block mr-2" />
            Add New User
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
        {users.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300 text-center">
            No users found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                            : user.role === "subadmin"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(subAdminPermissions.canEditAllUsers ||
                        subAdminPermissions.canEditSpecificUsers?.includes(
                          user._id
                        )) && (
                        <>
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 mr-3"
                            title="Edit User"
                          >
                            <Edit size={18} />
                          </button>
                          {user.role !== "admin" && ( // Admins cannot delete other admins
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading subadmin dashboard...
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
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                SubAdmin Panel
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
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
                <p className="text-sm text-purple-500">SubAdmin</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveView("overview")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === "overview"
                  ? "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <Home size={20} />
              <span>Overview</span>
            </button>
            {(subAdminPermissions.canViewAllTasks ||
              subAdminPermissions.canViewSpecificUsers?.length > 0) && (
              <button
                onClick={() => setActiveView("manage-tasks")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeView === "manage-tasks"
                    ? "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <ListTodo size={20} />
                <span>Manage Tasks</span>
              </button>
            )}
            {(subAdminPermissions.canViewAllUsers ||
              subAdminPermissions.canViewSpecificUsers?.length > 0) && (
              <button
                onClick={() => setActiveView("manage-users")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeView === "manage-users"
                    ? "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <Users size={20} />
                <span>Manage Users</span>
              </button>
            )}
            {(subAdminPermissions.canEditAllTasks ||
              subAdminPermissions.canEditSpecificUsers?.length > 0) && (
              <button
                onClick={() => setShowTaskAssignModal(true)}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900"
              >
                <PlusCircle size={20} />
                <span>Assign New Task</span>
              </button>
            )}
          </nav>

          <div className="mt-8">
            <button
              onClick={logout}
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
            SubAdmin Dashboard
          </h1>
          <div className="w-6"></div>
        </div>
        {/* Content */}
        {activeView === "overview" && renderOverview()}
        {activeView === "manage-tasks" && renderManageTasks()}
        {activeView === "manage-users" && renderManageUsers()}
        {activeView === "unassigned-users" &&
          subAdminPermissions.canViewAllUsers &&
          renderManageUsers()}{" "}
        {/* Re-use user management for unassigned */}
      </div>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          users={users.filter((u) => u.role === "user")} // Only assign to regular users
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
        />
      )}

      {showTaskAssignModal && (
        <TaskAssignModal
          users={users.filter((u) => u.role === "user")} // Only assign to regular users
          onClose={() => setShowTaskAssignModal(false)}
          onAssign={handleCreateAndAssignTask}
        />
      )}

      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}

      {showEmailModal && (
        <EmailModal
          recipients={emailRecipients}
          onClose={() => setShowEmailModal(false)}
          onSend={handleSendEmail}
        />
      )}
    </div>
  );
};

export default SubAdminDashboard;
