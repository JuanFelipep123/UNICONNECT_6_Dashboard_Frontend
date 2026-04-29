import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { Button } from '@shared/components/ui/Button';
import { Card } from '@shared/components/ui/Card';
import { Modal } from '@shared/components/ui/Modal';
import { useAuthStore } from '@shared/store/authStore';
import type { StudyGroup, UserProfileSummary } from '../../domain/groups';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';
import { GroupUserRow } from '../components/GroupUserRow';

interface StudyGroupRealtimePayload {
  groupId: string;
  members?: unknown[];
  pendingRequests?: unknown[];
  action?: 'request_accepted' | 'request_rejected';
}

const realtimeSocketUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL || 'http://localhost:3000';

const toUserIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'number') return String(item);
      if (item && typeof item === 'object') {
        const maybeUser = item as Record<string, unknown>;
        if (typeof maybeUser.id === 'string') return maybeUser.id;
        if (typeof maybeUser.userId === 'string') return maybeUser.userId;
        if (typeof maybeUser.user_id === 'string') return maybeUser.user_id;
        if (typeof maybeUser.profile_id === 'string') return maybeUser.profile_id;
      }
      return '';
    })
    .filter((value) => value.length > 0);
};

const toRenderablePerson = (userId: string, profile?: UserProfileSummary): UserProfileSummary => {
  if (profile) return profile;

  return {
    id: userId,
    fullName: `Usuario ${userId.slice(0, 8)}`,
  };
};

export function GroupDetailPage() {
  const { groupId = '' } = useParams();
  const currentUserId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Record<string, UserProfileSummary>>({});
  const [processingRequestUserId, setProcessingRequestUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminTransferModal, setShowAdminTransferModal] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<string | null>(null);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const pendingRequests = group?.pendingRequests ?? [];
  const memberIds = group?.members ?? [];
  const membersCount = memberIds.length || group?.member_count || 0;
  const groupAdminId = group?.createdBy || group?.creator_id || '';
  const isGroupAdmin = Boolean(group && currentUserId && groupAdminId === currentUserId);
  const members = memberIds.map((memberId) => toRenderablePerson(memberId, profiles[memberId]));
  const pendingPeople = pendingRequests.map((requestUserId) => toRenderablePerson(requestUserId, profiles[requestUserId]));

  useEffect(() => {
    const load = async () => {
      if (!token || !groupId) {
        setPageError('Sesion invalida o grupo inexistente.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError(null);

      const response = await groupsHttpService.getGroup(groupId, token);
      if (!response.success || !response.data) {
        setPageError(response.error ?? 'No se pudo cargar el grupo.');
        setLoading(false);
        return;
      }

      setGroup(response.data);
      setLoading(false);
    };

    void load();
  }, [groupId, token]);

  useEffect(() => {
    if (!token || !currentUserId || !groupId) return;

    const socket = io(realtimeSocketUrl, {
      auth: {
        'x-user-id': currentUserId,
        Authorization: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    const joinGroupRoom = () => {
      socket.emit('study-group:join', { groupId });
    };

    const handleStudyGroupUpdated = (payload: StudyGroupRealtimePayload) => {
      if (payload.groupId !== groupId) return;

      setGroup((currentGroup) => {
        if (!currentGroup) return currentGroup;

        const nextMembers = toUserIds(payload.members);
        const nextPendingRequests = toUserIds(payload.pendingRequests);

        return {
          ...currentGroup,
          members: nextMembers,
          pendingRequests: nextPendingRequests,
          member_count: nextMembers.length,
        };
      });
      setActionError(null);
      setProcessingRequestUserId(null);
    };

    socket.on('connect', joinGroupRoom);
    socket.on('study-group:updated', handleStudyGroupUpdated);

    if (socket.connected) {
      joinGroupRoom();
    }

    return () => {
      socket.emit('study-group:leave', { groupId });
      socket.off('connect', joinGroupRoom);
      socket.off('study-group:updated', handleStudyGroupUpdated);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, groupId, token]);

  useEffect(() => {
    const loadProfiles = async () => {
      if (!token) return;

      const missingUserIds = [...new Set([...memberIds, ...pendingRequests])].filter((requestUserId) => !profiles[requestUserId]);
      if (missingUserIds.length === 0) return;

      const entries = await Promise.all(
        missingUserIds.map(async (requestUserId) => {
          const response = await groupsHttpService.getProfileById(requestUserId, token);

          if (!response.success || !response.data) {
            return [
              requestUserId,
              {
                id: requestUserId,
                fullName: `Usuario ${requestUserId.slice(0, 8)}`,
              },
            ] as const;
          }

          return [requestUserId, response.data] as const;
        }),
      );

      setProfiles((prevProfiles) => {
        const nextProfiles = { ...prevProfiles };
        for (const [requestUserId, profile] of entries) {
          nextProfiles[requestUserId] = profile;
        }
        return nextProfiles;
      });
    };

    void loadProfiles();
  }, [memberIds, pendingRequests, profiles, token]);

  const processRequest = async (requestUserId: string, action: 'accept' | 'reject') => {
    if (!group || !token) return;

    setActionError(null);
    setProcessingRequestUserId(requestUserId);

    const response =
      action === 'accept'
        ? await groupsHttpService.acceptRequest(group.id, requestUserId, token)
        : await groupsHttpService.rejectRequest(group.id, requestUserId, token);

    setProcessingRequestUserId(null);

    if (!response.success || !response.data) {
      setActionError(response.error ?? 'No se pudo procesar la solicitud.');
      return;
    }

    setGroup(response.data);
  };

  const handleInitiateLeave = () => {
    setLeaveError(null);
    if (isGroupAdmin) {
      setShowAdminTransferModal(true);
    } else {
      void handleLeaveGroup();
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !token) return;

    setLeavingGroup(true);
    setLeaveError(null);

    const response = await groupsHttpService.leaveGroup(group.id, token);

    if (!response.success) {
      setLeaveError(response.error ?? 'No se pudo abandonar el grupo.');
      setLeavingGroup(false);
      return;
    }

    // El abandono fue exitoso, navegar de vuelta a la lista de grupos
    window.location.href = '/groups';
  };

  const handleConfirmTransferAndLeave = async () => {
    if (!group || !token || !selectedNewAdmin) return;

    setLeavingGroup(true);
    setLeaveError(null);

    const response = await groupsHttpService.transferAdminAndLeave(group.id, selectedNewAdmin, token);

    if (!response.success) {
      setLeaveError(response.error ?? 'No se pudo transferir la administración.');
      setLeavingGroup(false);
      return;
    }

    // La transferencia fue exitosa, navegar de vuelta a la lista de grupos
    window.location.href = '/groups';
  };

  if (loading) {
    return <p className="text-sm text-ink-700">Cargando detalle...</p>;
  }

  if (pageError || !group) {
    return <Card className="text-sm font-medium text-red-600">{pageError ?? 'No se encontro el grupo.'}</Card>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-ink-900">{group.name}</h1>

      <Card className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-ink-700">{group.description}</p>
          <p className="text-sm text-ink-500">Materia: {group.subject?.name ?? 'Sin materia'}</p>
          <p className="text-sm text-ink-500">Miembros: {membersCount}</p>
          <p className="text-sm text-ink-500">Solicitudes pendientes: {pendingRequests.length}</p>
          <p className="text-sm text-ink-500">Administrador: {group.is_admin ? 'Si' : 'No'}</p>
        </div>

        <div className="border-t border-ink-200 pt-3">
          <Button
            type="button"
            variant="danger"
            disabled={leavingGroup}
            onClick={handleInitiateLeave}
            className="w-full"
          >
            {leavingGroup ? 'Abandonando...' : 'Abandonar grupo'}
          </Button>
          {leaveError ? <p className="mt-2 text-sm font-medium text-red-600">{leaveError}</p> : null}
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Miembros del grupo</h2>
          <p className="text-sm text-ink-500">Consulta quiénes forman parte del grupo y quién administra la sala.</p>
        </div>

        {members.length > 0 ? (
          <ul className="space-y-3">
            {members.map((member) => (
              <GroupUserRow
                key={member.id}
                person={member}
                isAdmin={member.id === groupAdminId}
                description={member.id === groupAdminId ? 'Administrador del grupo' : 'Miembro activo'}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-500">Aún no hay miembros cargados para este grupo.</p>
        )}
      </Card>

      {pendingRequests.length > 0 ? (
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Solicitudes Pendientes</h2>
            <p className="text-sm text-ink-500">Revisa y decide si deseas aceptar o rechazar a cada solicitante.</p>
          </div>

          {actionError ? <p className="text-sm font-medium text-red-600">{actionError}</p> : null}

          <ul className="space-y-3">
            {pendingPeople.map((person) => (
              <GroupUserRow
                key={person.id}
                person={person}
                description="Solicitud pendiente"
                trailingContent={
                  isGroupAdmin ? (
                    <>
                      <Button
                        type="button"
                        disabled={processingRequestUserId !== null}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => void processRequest(person.id, 'accept')}
                      >
                        {processingRequestUserId === person.id ? 'Procesando...' : 'Aceptar'}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={processingRequestUserId !== null}
                        onClick={() => void processRequest(person.id, 'reject')}
                      >
                        {processingRequestUserId === person.id ? 'Procesando...' : 'Rechazar'}
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs font-medium text-ink-500">Solo el administrador puede gestionar solicitudes.</p>
                  )
                }
              />
            ))}
          </ul>
        </Card>
      ) : null}

      <Modal
        isOpen={showAdminTransferModal}
        onClose={() => {
          setShowAdminTransferModal(false);
          setSelectedNewAdmin(null);
          setLeaveError(null);
        }}
        title="Transferir Administración"
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={leavingGroup}
              onClick={() => {
                setShowAdminTransferModal(false);
                setSelectedNewAdmin(null);
                setLeaveError(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!selectedNewAdmin || leavingGroup}
              onClick={() => void handleConfirmTransferAndLeave()}
              className="flex-1"
            >
              {leavingGroup ? 'Transfiriendo...' : 'Transferir y salir'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            Como administrador del grupo, debes seleccionar un nuevo administrador antes de salir. Elige uno de los miembros disponibles.
          </p>

          {leaveError ? <p className="text-sm font-medium text-red-600">{leaveError}</p> : null}

          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-700">Miembros disponibles:</p>

            {members.length > 1 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {members.map((member) => {
                  if (member.id === currentUserId) return null;

                  const isSelected = selectedNewAdmin === member.id;

                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedNewAdmin(member.id)}
                      className={`flex items-center gap-3 rounded-md border-2 p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-ink-200 bg-white hover:border-ink-300'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-ink-200 flex items-center justify-center text-xs font-semibold text-ink-700 flex-shrink-0">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">{member.fullName}</p>
                        <p className="text-xs text-ink-500">Miembro activo</p>
                      </div>
                      <div className="h-4 w-4 rounded border-2 border-ink-300 flex items-center justify-center flex-shrink-0">
                        {isSelected ? (
                          <div className="h-2 w-2 rounded-full bg-emerald-600" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-ink-600">No hay otros miembros disponibles en el grupo.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
