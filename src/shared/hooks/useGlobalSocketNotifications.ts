import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@shared/store/authStore';
import { useToast } from '@shared/components/ui/ToastProvider';

interface DomainEventPayload {
  type: 'SOLICITUD_INGRESO' | 'MIEMBRO_ACEPTADO' | 'MIEMBRO_RECHAZADO' | 'TRANSFERENCIA_ADMIN';
  groupId: string;
  actorUserId: string;
  data: any;
  timestamp: string;
}

const realtimeSocketUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL || 'http://localhost:3000';

const NOTIFICATION_MESSAGES: Record<DomainEventPayload['type'], string> = {
  SOLICITUD_INGRESO: '¡Tienes una nueva solicitud de ingreso en tu grupo!',
  MIEMBRO_ACEPTADO: '¡Tu solicitud de ingreso fue aceptada!',
  MIEMBRO_RECHAZADO: 'Tu solicitud de ingreso ha sido rechazada.',
  TRANSFERENCIA_ADMIN: 'Se te ha solicitado asumir la administración de un grupo.',
};

export function useGlobalSocketNotifications(onNewNotification?: () => void) {
  const currentUserId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    if (!token || !currentUserId) return;

    const socket: Socket = io(realtimeSocketUrl, {
      auth: {
        'x-user-id': currentUserId,
        Authorization: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const joinUserRoom = () => {
      // Nos unimos a la sala personal del usuario
      socket.emit('user:join', { userId: currentUserId });
    };

    const handleDomainEvent = (payload: DomainEventPayload) => {
      // 1. Evitar mostrar toast si el usuario ya está viendo el detalle de este grupo en particular
      const isViewingGroup = location.pathname === `/groups/${payload.groupId}`;
      
      if (!isViewingGroup) {
        // 2. Mapear y mostrar Toast
        const message = NOTIFICATION_MESSAGES[payload.type];
        if (message) {
          // Asumimos que MIEMBRO_RECHAZADO puede ser de tipo error, los demás success/info
          const toastType = payload.type === 'MIEMBRO_RECHAZADO' ? 'error' : 'info';
          toast.push(message, toastType);
        }
      }

      // 3. Refrescar campanita (si la callback existe)
      if (onNewNotification) {
        onNewNotification();
      }
    };

    socket.on('connect', joinUserRoom);
    socket.on('study-group:domain-event', handleDomainEvent);

    if (socket.connected) {
      joinUserRoom();
    }

    return () => {
      socket.off('connect', joinUserRoom);
      socket.off('study-group:domain-event', handleDomainEvent);
      socket.disconnect();
    };
  }, [currentUserId, token, location.pathname, toast, onNewNotification]);
}
