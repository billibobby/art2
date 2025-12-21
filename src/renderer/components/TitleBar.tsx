import React, { useState, useEffect } from 'react'

const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // Get initial maximize state
    const getInitialState = async () => {
      const maximized = await window.electronAPI.isWindowMaximized()
      setIsMaximized(maximized)
    }
    
    getInitialState()

    // Listen for maximize state changes
    window.electronAPI.onWindowMaximizeChanged((maximized) => {
      setIsMaximized(maximized)
    })
  }, [])

  const handleMinimize = () => {
    window.electronAPI.minimizeWindow()
  }

  const handleMaximize = () => {
    window.electronAPI.maximizeWindow()
  }

  const handleClose = () => {
    window.electronAPI.closeWindow()
  }

  return (
    <div className="titlebar h-8 bg-dark-sidebar border-b border-dark-border flex items-center justify-between px-4 select-none">
      {/* App Title */}
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-accent-blue rounded-sm flex items-center justify-center">
          <span className="text-white text-xs">🎨</span>
        </div>
        <span className="text-sm font-medium text-white">Art Analyst</span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center space-x-1">
        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-dark-hover transition-colors duration-150"
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor" className="text-gray-300">
            <rect width="10" height="1" />
          </svg>
        </button>

        {/* Maximize/Restore Button */}
        <button
          onClick={handleMaximize}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-dark-hover transition-colors duration-150"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-300">
              <rect x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
              <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-300">
              <rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-600 transition-colors duration-150"
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-gray-300">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default TitleBar