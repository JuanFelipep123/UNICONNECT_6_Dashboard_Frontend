import { API_BASE_URL } from '../api/apiClient';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  group_id?: string;
  read: boolean;
  created_at: string;
}

export const notificationsService = {
  async getNotifications(token: string): Promise<AppNotification[]> {
    try {
      // Endpoint a definir en el API Gateway / Social Service
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      // Asegurarse de retornar el array de notificaciones
      // Dependiendo de cómo responda tu backend (ej. { data: [...] } o simplemente [...])
      const notifications: AppNotification[] = Array.isArray(data) ? data : (data.data || []);
      
      // Ordenar por created_at descendente y mostrar primero las no leídas (read: false)
      return notifications.sort((a, b) => {
        if (a.read === b.read) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.read ? 1 : -1;
      });
    } catch (error) {
      console.error('[notificationsService] Error fetching notifications:', error);
      return [];
    }
  },

  async markAsRead(notificationId: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('[notificationsService] Error marking notification as read:', error);
      return false;
    }
  }
};
