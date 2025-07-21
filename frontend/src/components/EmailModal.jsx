"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const EmailModal = ({ recipients, onClose, onSend }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-select all recipients passed in props by default
    setSelectedRecipients(recipients.map((r) => r.email));
  }, [recipients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSend(selectedRecipients, subject, message);
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientChange = (e) => {
    const { value, checked } = e.target;
    setSelectedRecipients((prev) =>
      checked ? [...prev, value] : prev.filter((email) => email !== value)
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Send Email
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipients
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 dark:border-gray-600">
                {recipients.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    No recipients available.
                  </p>
                ) : (
                  recipients.map((user) => (
                    <div key={user._id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`recipient-${user._id}`}
                        value={user.email}
                        checked={selectedRecipients.includes(user.email)}
                        onChange={handleRecipientChange}
                        disabled={loading}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                      />
                      <label
                        htmlFor={`recipient-${user._id}`}
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
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Enter email subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Enter email message"
              />
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
              disabled={
                loading ||
                selectedRecipients.length === 0 ||
                !subject.trim() ||
                !message.trim()
              }
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailModal;
