import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';

const notificationIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const notificationStyles = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-900',
    icon: 'text-green-600',
    button: 'text-green-600 hover:text-green-800 hover:bg-green-100',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-900',
    icon: 'text-red-600',
    button: 'text-red-600 hover:text-red-800 hover:bg-red-100',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: 'text-amber-600',
    button: 'text-amber-600 hover:text-amber-800 hover:bg-amber-100',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: 'text-blue-600',
    button: 'text-blue-600 hover:text-blue-800 hover:bg-blue-100',
  },
};

interface NotificationToastProps {
  notification: Notification;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
  const { removeNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const Icon = notificationIcons[notification.type];
  const styles = notificationStyles[notification.type];

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300);
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        max-w-sm w-full bg-white rounded-lg border shadow-lg pointer-events-auto
        ${styles.container}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${styles.icon}`} />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="mt-1 text-sm opacity-90">{notification.message}</p>
            {notification.action && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={notification.action.onClick}
                  className={`text-xs ${styles.button} border-current/30`}
                >
                  {notification.action.label}
                </Button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
              onClick={handleClose}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotifications();

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-end px-4 py-6 pointer-events-none sm:p-6 z-50"
    >
      <div className="w-full flex flex-col items-end space-y-4 sm:items-end">
        {notifications.map((notification) => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
};