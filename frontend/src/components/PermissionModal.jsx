"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const PermissionModal = ({ subAdmin, users, onClose, onSave }) => {
  const [permissions, setPermissions] = useState({
    canViewAllUsers: false,
    canEditAllUsers: false,
    canSendEmails: false,
    canViewSpecificUsers: [],
    canEditSpecificUsers: [],
    canViewAllTasks: false, // Added for completeness, though not directly used in this modal's UI
    canEditAllTasks: false, // Added for completeness, though not directly used in this modal's UI
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subAdmin?.permissions) {
      setPermissions({
        canViewAllUsers: subAdmin.permissions.canViewAllUsers || false,
        canEditAllUsers: subAdmin.permissions.canEditAllUsers || false,
        canSendEmails: subAdmin.permissions.canSendEmails || false,
        canViewSpecificUsers: subAdmin.permissions.canViewSpecificUsers || [],
        canEditSpecificUsers: subAdmin.permissions.canEditSpecificUsers || [],
        canViewAllTasks: subAdmin.permissions.canViewAllTasks || false,
        canEditAllTasks: subAdmin.permissions.canEditAllTasks || false,
      });
    } else {
      // Reset permissions if no subAdmin or permissions are provided
      setPermissions({
        canViewAllUsers: false,
        canEditAllUsers: false,
        canSendEmails: false,
        canViewSpecificUsers: [],
        canEditSpecificUsers: [],
        canViewAllTasks: false,
        canEditAllTasks: false,
      });
    }
  }, [subAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(subAdmin._id, permissions);
      // onClose() // Close modal is handled by onSave in AdminDashboard
    } catch (error) {
      console.error("Error updating permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setPermissions((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSpecificUserChange = (e, type) => {
    const { value, checked } = e.target;
    setPermissions((prev) => {
      const currentUsers = prev[type];
      if (checked) {
        return { ...prev, [type]: [...currentUsers, value] };
      } else {
        return { ...prev, [type]: currentUsers.filter((id) => id !== value) };
      }
    });
  };

  const regularUsers = users.filter((u) => u.role === "user");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Manage Permissions - {subAdmin?.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={loading}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Global Permissions
            </h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="canViewAllUsers"
                id="canViewAllUsers"
                checked={permissions.canViewAllUsers}
                onChange={handleCheckboxChange}
                disabled={loading}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
              />
              <label
                htmlFor="canViewAllUsers"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
              >
                Can View All Users
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="canEditAllUsers"
                id="canEditAllUsers"
                checked={permissions.canEditAllUsers}
                onChange={handleCheckboxChange}
                disabled={loading}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
              />
              <label
                htmlFor="canEditAllUsers"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
              >
                Can Edit All Users' Tasks
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="canSendEmails"
                id="canSendEmails"
                checked={permissions.canSendEmails}
                onChange={handleCheckboxChange}
                disabled={loading}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
              />
              <label
                htmlFor="canSendEmails"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
              >
                Can Send Emails
              </label>
            </div>
            {/* Global Task Permissions - added for completeness, UI not directly in this modal */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="canViewAllTasks"
                id="canViewAllTasks"
                checked={permissions.canViewAllTasks}
                onChange={handleCheckboxChange}
                disabled={loading}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
              />
              <label
                htmlFor="canViewAllTasks"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
              >
                Can View All Tasks
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="canEditAllTasks"
                id="canEditAllTasks"
                checked={permissions.canEditAllTasks}
                onChange={handleCheckboxChange}
                disabled={loading}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
              />
              <label
                htmlFor="canEditAllTasks"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
              >
                Can Edit All Tasks
              </label>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-6">
              Specific User Permissions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Select specific users this sub-admin can view or edit tasks for.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Can View Tasks for:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {regularUsers.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">
                      No regular users available.
                    </p>
                  ) : (
                    regularUsers.map((user) => (
                      <div key={user._id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`view-${user._id}`}
                          value={user._id}
                          checked={permissions.canViewSpecificUsers.includes(
                            user._id
                          )}
                          onChange={(e) =>
                            handleSpecificUserChange(e, "canViewSpecificUsers")
                          }
                          disabled={loading || permissions.canViewAllUsers}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                        />
                        <label
                          htmlFor={`view-${user._id}`}
                          className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                        >
                          {user.name} ({user.email})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Can Edit Tasks for:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {regularUsers.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">
                      No regular users available.
                    </p>
                  ) : (
                    regularUsers.map((user) => (
                      <div key={user._id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`edit-${user._id}`}
                          value={user._id}
                          checked={permissions.canEditSpecificUsers.includes(
                            user._id
                          )}
                          onChange={(e) =>
                            handleSpecificUserChange(e, "canEditSpecificUsers")
                          }
                          disabled={loading || permissions.canEditAllUsers}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                        />
                        <label
                          htmlFor={`edit-${user._id}`}
                          className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                        >
                          {user.name} ({user.email})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionModal;
