import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { notificationsService, type AppNotification } from '../../services/notifications/notificationsService';
import { useGlobalSocketNotifications } from '../../hooks/useGlobalSocketNotifications';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const token = useAuthStore((state) => state.token);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    if (!token) return;
    const data = await notificationsService.getNotifications(token);
    setNotifications(data);
  };

  // Carga inicial
  useEffect(() => {
    void loadNotifications();
  }, [token]);

  // Escuchar notificaciones por WebSockets
  useGlobalSocketNotifications(() => {
    // Cuando llega un evento socket, recargamos la tabla de notificaciones
    void loadNotifications();
  });

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read && token) {
      const success = await notificationsService.markAsRead(notification.id, token);
      if (success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      }
    }
    setIsOpen(false);
    
    // Navegar al grupo si aplica
    if (notification.group_id) {
      navigate(`/groups/${notification.group_id}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 rounded-full hover:bg-ink-100 transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#00284D' }}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl border border-ink-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 bg-ink-50">
            <h3 className="font-semibold text-ink-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-ink-500">{unreadCount} no leídas</span>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="material-symbols-outlined text-ink-300" style={{ fontSize: '32px' }}>
                  notifications_off
                </span>
                <p className="mt-2 text-sm text-ink-500">No tienes notificaciones</p>
              </div>
            ) : (
              <ul className="divide-y divide-ink-100">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => void handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 hover:bg-ink-50 transition-colors ${
                        !notification.read ? 'bg-[#f4f8ff]' : ''
                      }`}
                    >
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-ink-500 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
