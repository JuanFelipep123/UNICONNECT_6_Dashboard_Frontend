import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { Button } from '@shared/components/ui/Button';
import { Card } from '@shared/components/ui/Card';
import { Modal } from '@shared/components/ui/Modal';
import { useAuthStore } from '@shared/store/authStore';
import { useToast } from '@shared/components/ui/ToastProvider';
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
  const [isTransferPending, setIsTransferPending] = useState(false);
  const [pendingTransferCandidate, setPendingTransferCandidate] = useState<string | null>(null);
  const [showTransferResponseModal, setShowTransferResponseModal] = useState(false);
  const [transferCandidateName, setTransferCandidateName] = useState<string>('');
  const [respondingToTransfer, setRespondingToTransfer] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const toast = useToast();

  // ── Refs to avoid socket effect re-runs on every profile/admin change ──
  const profilesRef = useRef<Record<string, UserProfileSummary>>(profiles);
  const isGroupAdminRef = useRef(false);
  const toastRef = useRef(toast);

  const pendingRequests = group?.pendingRequests ?? [];
  const memberIds = group?.members ?? [];
  const membersCount = memberIds.length || group?.member_count || 0;
  const groupAdminId = group?.createdBy || group?.creator_id || '';
  const isGroupAdmin = Boolean(group && currentUserId && groupAdminId === currentUserId);
  const members = memberIds.map((memberId) => toRenderablePerson(memberId, profiles[memberId]));

  // ── Keep refs in sync with latest state ──
  useEffect(() => { profilesRef.current = profiles; }, [profiles]);
  useEffect(() => { isGroupAdminRef.current = isGroupAdmin; }, [isGroupAdmin]);
  useEffect(() => { toastRef.current = toast; }, [toast]);
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

      if (
        response.data.pendingAdminTransfer?.status === 'pending' &&
        response.data.pendingAdminTransfer.toUserId === currentUserId
      ) {
        const fromUserId = response.data.pendingAdminTransfer.fromUserId;
        setShowTransferResponseModal(true);
        groupsHttpService.getProfileById(fromUserId, token).then((prof) => {
          if (prof.success && prof.data) {
            setTransferCandidateName(prof.data.fullName);
          } else {
            setTransferCandidateName(`Usuario ${fromUserId.slice(0, 8)}`);
          }
        });
      }
    };

    void load();
  }, [groupId, token, currentUserId]);

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

    const handleAdminTransferRequested = (payload: { groupId: string; fromUserId: string; toUserId: string }) => {
      if (payload.groupId !== groupId || payload.toUserId !== currentUserId) return;

      const candidateName = profilesRef.current[payload.fromUserId]?.fullName || `Usuario ${payload.fromUserId.slice(0, 8)}`;
      setTransferCandidateName(candidateName);
      setShowTransferResponseModal(true);
      toastRef.current.push(`Te han seleccionado como posible administrador por ${candidateName}`, 'info');
    };

    const handleAdminTransferAccepted = (payload: { groupId: string; newAdminId: string }) => {
      if (payload.groupId !== groupId) return;

      setGroup((currentGroup) => {
        if (!currentGroup) return currentGroup;
        return {
          ...currentGroup,
          createdBy: payload.newAdminId,
          creator_id: payload.newAdminId,
        };
      });

      setIsTransferPending(false);
      setPendingTransferCandidate(null);
      setShowAdminTransferModal(false);
      setSelectedNewAdmin(null);

      const newAdminName = profilesRef.current[payload.newAdminId]?.fullName || `Usuario ${payload.newAdminId.slice(0, 8)}`;
      toastRef.current.push(`Transferencia aceptada: ${newAdminName} es el nuevo administrador.`, 'success');
      if (isGroupAdminRef.current) {
        setLeaveError(null);
      }
    };

    const handleAdminTransferRejected = (payload: { groupId: string }) => {
      if (payload.groupId !== groupId) return;

      setIsTransferPending(false);
      setPendingTransferCandidate(null);
      setLeaveError('El usuario rechazó la transferencia de administración. Intenta con otro miembro.');
      toastRef.current.push('El usuario rechazó la transferencia de administración.', 'error');
    };

    socket.on('connect', joinGroupRoom);
    socket.on('study-group:updated', handleStudyGroupUpdated);
    socket.on('admin_transfer_requested', handleAdminTransferRequested);
    socket.on('admin_transfer_accepted', handleAdminTransferAccepted);
    socket.on('admin_transfer_rejected', handleAdminTransferRejected);

    if (socket.connected) {
      joinGroupRoom();
    }

    return () => {
      socket.emit('study-group:leave', { groupId });
      socket.off('connect', joinGroupRoom);
      socket.off('study-group:updated', handleStudyGroupUpdated);
      socket.off('admin_transfer_requested', handleAdminTransferRequested);
      socket.off('admin_transfer_accepted', handleAdminTransferAccepted);
      socket.off('admin_transfer_rejected', handleAdminTransferRejected);
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

    window.location.href = '/groups';
  };

  const handleConfirmTransferAndLeave = async () => {
    if (!group || !token || !selectedNewAdmin) return;

    setTransferSubmitting(true);
    setLeaveError(null);

    const response = await groupsHttpService.transferAdminAndLeave(group.id, selectedNewAdmin, token);

    setTransferSubmitting(false);

    if (!response.success) {
      setLeaveError(response.error ?? 'No se pudo transferir la administración.');
      return;
    }

    setIsTransferPending(true);
    setPendingTransferCandidate(selectedNewAdmin);
    setShowAdminTransferModal(false);
    setSelectedNewAdmin(null);
    const candidateName = profiles[selectedNewAdmin!]?.fullName || `Usuario ${selectedNewAdmin!.slice(0, 8)}`;
    toast.push(`Solicitud enviada a ${candidateName}`, 'info');
  };

  const handleRespondTransfer = async (action: 'accept' | 'reject') => {
    if (!group || !token) return;

    setRespondingToTransfer(true);

    const response = await groupsHttpService.respondTransferAdmin(group.id, action, token);

    setRespondingToTransfer(false);

    if (!response.success || !response.data) {
      setActionError(response.error ?? 'No se pudo responder la solicitud.');
      return;
    }

    setGroup(response.data);
    setShowTransferResponseModal(false);
    if (action === 'accept') {
      toast.push('Has aceptado la transferencia. Ahora eres administrador.', 'success');
    } else {
      toast.push('Has rechazado la transferencia.', 'info');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <span
            className="material-symbols-outlined animate-spin"
            style={{ fontSize: '32px', color: '#D4AF37' }}
          >
            progress_activity
          </span>
          <p className="text-sm font-medium" style={{ color: '#73777f' }}>
            Cargando detalle del grupo...
          </p>
        </div>
      </div>
    );
  }

  if (pageError || !group) {
    return (
      <Card
        className="text-sm font-medium"
        style={{ color: '#ba1a1a', borderColor: '#ffdad6', background: '#fff8f7' }}
      >
        {pageError ?? 'No se encontró el grupo.'}
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-serif font-bold" style={{ fontSize: '28px', color: '#00132a', letterSpacing: '-0.01em' }}>{group.name}</h1>

      <Card className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-ink-700">{group.description}</p>
          <p className="text-sm text-ink-500">Materia: {group.subject?.name ?? 'Sin materia'}</p>
          <p className="text-sm text-ink-500">Miembros: {membersCount}</p>
          <p className="text-sm text-ink-500">Solicitudes pendientes: {pendingRequests.length}</p>
          <p className="text-sm text-ink-500">Administrador: {group.is_admin ? 'Si' : 'No'}</p>

          {isTransferPending && pendingTransferCandidate ? (
            <div className="rounded-xl p-3" style={{ background: '#d3e3ff', border: '1px solid #aac8f6' }}>
              <p className="text-sm font-medium" style={{ color: '#001c39' }}>
                ⏳ Transferencia en proceso...
              </p>
              <p className="text-xs mt-1" style={{ color: '#29486e' }}>
                Esperando respuesta de {profiles[pendingTransferCandidate]?.fullName || `Usuario ${pendingTransferCandidate.slice(0, 8)}`}
              </p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-ink-200 pt-3">
          <Button
            type="button"
            variant="danger"
            disabled={leavingGroup || isTransferPending}
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
          <h2 className="font-serif font-semibold text-lg" style={{ color: '#00132a' }}>Miembros del grupo</h2>
          <p className="text-sm mt-0.5" style={{ color: '#73777f' }}>Consulta quiénes forman parte del grupo y quién administra la sala.</p>
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
            <h2 className="font-serif font-semibold text-lg" style={{ color: '#00132a' }}>Solicitudes Pendientes</h2>
            <p className="text-sm mt-0.5" style={{ color: '#73777f' }}>Revisa y decide si deseas aceptar o rechazar a cada solicitante.</p>
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
              disabled={!selectedNewAdmin || transferSubmitting}
              onClick={() => void handleConfirmTransferAndLeave()}
              className="flex-1"
            >
              {transferSubmitting ? 'Enviando...' : 'Transferir y salir'}
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
                      style={{
                      border: `2px solid ${isSelected ? '#D4AF37' : '#E9ECEF'}`,
                      background: isSelected ? '#fffbe6' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    className="flex items-center gap-3 rounded-xl p-3"
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
                          <div className="h-2 w-2 rounded-full" style={{ background: '#D4AF37' }} />
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

      <Modal
        isOpen={showTransferResponseModal}
        onClose={() => setShowTransferResponseModal(false)}
        title="Solicitud de Administración"
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={respondingToTransfer}
              onClick={() => void handleRespondTransfer('reject')}
              className="flex-1"
            >
              {respondingToTransfer ? 'Procesando...' : 'Rechazar'}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={respondingToTransfer}
              onClick={() => void handleRespondTransfer('accept')}
            >
              {respondingToTransfer ? 'Procesando...' : 'Aceptar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            Te han asignado como nuevo administrador del grupo. ¿Aceptas esta responsabilidad?
          </p>

          {actionError ? <p className="text-sm font-medium text-red-600">{actionError}</p> : null}

          <div className="rounded-xl p-3" style={{ background: '#d3e3ff', border: '1px solid #aac8f6' }}>
            <p className="text-sm font-medium" style={{ color: '#001c39' }}>
              {transferCandidateName} está dejando el grupo
            </p>
            <p className="text-xs mt-1" style={{ color: '#29486e' }}>
              Como nuevo administrador, serás responsable de gestionar solicitudes y miembros.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
