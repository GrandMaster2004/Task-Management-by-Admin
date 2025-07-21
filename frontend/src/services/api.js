const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("token");
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem("token");
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log(`Making request to: ${url}`, config);
      const response = await fetch(url, config);

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      console.log(`Response from ${url}:`, response.status, data);

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
          throw new Error("Authentication failed. Please login again.");
        }
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // Auth methods
  async register(userData) {
    return this.request("/user/register", {
      method: "POST",
      body: userData,
    });
  }

  async login(credentials) {
    return this.request("/user/login", {
      method: "POST",
      body: credentials,
    });
  }

  async getCurrentUser() {
    return this.request("/user/me");
  }

  // Task methods
  async getTasks() {
    return this.request("/tasks/gp", {
      method: "GET",
    });
  }

  async createTask(taskData) {
    const transformedData = {
      title: taskData.title,
      description: taskData.description || "",
      priority: taskData.priority || "Low",
      dueDate: taskData.dueDate || null,
      completed: taskData.completed || false,
      assignedTo: taskData.assignedTo || null,
    };

    return this.request("/tasks/gp", {
      method: "POST",
      body: transformedData,
    });
  }

  async updateTask(taskId, taskData) {
    const transformedData = {
      title: taskData.title,
      description: taskData.description || "",
      priority: taskData.priority || "Low",
      dueDate: taskData.dueDate || null,
      completed: taskData.completed || false,
      assignedTo: taskData.assignedTo || null,
    };

    return this.request(`/tasks/${taskId}/gp`, {
      method: "POST",
      body: transformedData,
    });
  }

  async deleteTask(taskId) {
    return this.request(`/tasks/${taskId}/gp`, {
      method: "DELETE",
    });
  }

  async getTaskById(taskId) {
    return this.request(`/tasks/${taskId}/gp`, {
      method: "GET",
    });
  }

  // Admin methods
  async getAllUsers() {
    return this.request("/admin/users", {
      method: "GET",
    });
  }

  async createUser(userData) {
    return this.request("/admin/users", {
      method: "POST",
      body: userData,
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/admin/users/${userId}`, {
      method: "PUT",
      body: userData,
    });
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  }

  async assignTask(taskData) {
    return this.request("/admin/assign-task", {
      method: "POST",
      body: taskData,
    });
  }

  async getSubAdmins() {
    return this.request("/admin/subadmins", {
      method: "GET",
    });
  }

  async createSubAdmin(userData) {
    return this.request("/admin/subadmins", {
      method: "POST",
      body: userData,
    });
  }

  async updateSubAdminPermissions(subAdminId, permissions) {
    return this.request(`/admin/subadmins/${subAdminId}/permissions`, {
      method: "PUT",
      body: permissions,
    });
  }

  async getAllTasks() {
    return this.request("/admin/tasks", {
      method: "GET",
    });
  }

  // SubAdmin methods
  async getAccessibleUsers() {
    return this.request("/subadmin/users", {
      method: "GET",
    });
  }

  async getAssignedTasks() {
    return this.request("/subadmin/tasks", {
      method: "GET",
    });
  }

  async updateUserAsSubAdmin(userId, userData) {
    return this.request(`/subadmin/users/${userId}`, {
      method: "PUT",
      body: userData,
    });
  }

  async createTaskAsSubAdmin(taskData) {
    return this.request("/subadmin/tasks", {
      method: "POST",
      body: taskData,
    });
  }
}

export default new ApiService();
