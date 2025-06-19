import React from 'react';

interface EngieNotificationsProps {
  unreadCount: number;
  notificationOpen: boolean;
  ideaNotifications: string[];
  onDismissNotification: (index: number) => void;
}

export const EngieNotifications: React.FC<EngieNotificationsProps> = ({
  unreadCount,
  notificationOpen,
  ideaNotifications,
  onDismissNotification,
}) => {
  // Notification peek style (partially hidden behind Engie)
  const notificationPeek = (
    unreadCount > 0 && !notificationOpen && (
      <div
        className="absolute top-1/2 left-full -translate-y-1/2 -ml-2 z-40"
        style={{ 
          width: 32, 
          height: 32, 
          background: 'linear-gradient(135deg, #a78bfa, #6366f1)', 
          borderRadius: '50%', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)' 
        }}
        aria-label="New Engie Idea"
      >
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
          {unreadCount}
        </span>
      </div>
    )
  );

  // Notification popout (smaller than Engie)
  const notificationPopout = (
    notificationOpen && unreadCount > 0 && (
      <div
        className="absolute top-1/2 left-full -translate-y-1/2 ml-2 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-2 flex flex-col items-center animate-fade-in"
        style={{ width: 180, minHeight: 48, maxWidth: 200 }}
      >
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-blue-600 dark:text-blue-300 font-semibold text-xs">Engie Idea</span>
          <button 
            onClick={() => onDismissNotification(0)} 
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-base font-bold"
          >
            ×
          </button>
        </div>
        <div className="text-gray-800 dark:text-gray-100 text-xs whitespace-pre-line min-h-[32px]">
          {ideaNotifications[0]}
        </div>
        {unreadCount > 1 && (
          <div className="mt-1 text-2xs text-gray-400">+{unreadCount - 1} more</div>
        )}
      </div>
    )
  );

  return (
    <>
      {notificationPeek}
      {notificationPopout}
    </>
  );
}; 