"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle } from "lucide-react"

const ErrorNotification = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation to complete
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="flex items-start space-x-3">
        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">Error</p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <button onClick={handleClose} className="text-white hover:text-gray-200">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default ErrorNotification
