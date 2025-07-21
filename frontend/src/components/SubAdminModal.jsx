"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const SubAdminModal = ({
  userToPromote,
  users,
  onClose,
  onPromote,
  onUpdate,
}) => {
  const isEditMode = !!userToPromote && userToPromote.role === "subadmin";
  const [formData, setFormData] = useState({
    userId: userToPromote?._id || "",
    name: userToPromote?.name || "",
    email: userToPromote?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(
    userToPromote?._id || ""
  );

  useEffect(() => {
    if (userToPromote) {
      setFormData({
        userId: userToPromote._id,
        name: userToPromote.name || "",
        email: userToPromote.email || "",
      });
      setSelectedUserId(userToPromote._id);
    } else {
      setFormData({ userId: "", name: "", email: "" });
      setSelectedUserId("");
    }
  }, [userToPromote]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        // If editing an existing sub-admin, update their details (name/email)
        await onUpdate(formData.userId, {
          name: formData.name,
          email: formData.email,
        });
      } else {
        // If promoting a new sub-admin, use the selectedUserId
        await onPromote(selectedUserId);
      }
      onClose();
    } catch (error) {
      console.error("Error saving sub-admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserSelectChange = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    const selectedUser = users.find((u) => u._id === userId);
    if (selectedUser) {
      setFormData((prev) => ({
        ...prev,
        userId: selectedUser._id,
        name: selectedUser.name,
        email: selectedUser.email,
      }));
    } else {
      setFormData((prev) => ({ ...prev, userId: "", name: "", email: "" }));
    }
  };

  const availableUsersForPromotion = users.filter((u) => u.role === "user");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {isEditMode ? "Edit Sub-Admin" : "Promote User to Sub-Admin"}
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
            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select User to Promote <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedUserId}
                  onChange={handleUserSelectChange}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="">Select a user</option>
                  {availableUsersForPromotion.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isEditMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </>
            )}
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
              disabled={loading || (!isEditMode && !selectedUserId)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving..."
                : isEditMode
                ? "Update Sub-Admin"
                : "Promote User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubAdminModal;
