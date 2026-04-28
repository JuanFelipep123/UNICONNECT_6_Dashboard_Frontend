import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@shared/components/ui/Button';
import { Card } from '@shared/components/ui/Card';
import { useAuthStore } from '@shared/store/authStore';
import type { StudyGroup, UserProfileSummary } from '../../domain/groups';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';

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

  const pendingRequests = group?.pendingRequests ?? [];
  const membersCount = group?.members?.length ?? group?.member_count ?? 0;
  const isGroupAdmin = Boolean(group && currentUserId && group.creator_id === currentUserId);

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
    const loadPendingProfiles = async () => {
      if (!token || pendingRequests.length === 0) return;

      const missingUserIds = pendingRequests.filter((requestUserId) => !profiles[requestUserId]);
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

    void loadPendingProfiles();
  }, [pendingRequests, profiles, token]);

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

  if (loading) {
    return <p className="text-sm text-ink-700">Cargando detalle...</p>;
  }

  if (pageError || !group) {
    return <Card className="text-sm font-medium text-red-600">{pageError ?? 'No se encontro el grupo.'}</Card>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-ink-900">{group.name}</h1>
      <Card className="space-y-3">
        <p className="text-sm text-ink-700">{group.description}</p>
        <p className="text-sm text-ink-500">Materia: {group.subject?.name ?? 'Sin materia'}</p>
        <p className="text-sm text-ink-500">Miembros: {membersCount}</p>
        <p className="text-sm text-ink-500">Solicitudes pendientes: {pendingRequests.length}</p>
        <p className="text-sm text-ink-500">Administrador: {group.is_admin ? 'Si' : 'No'}</p>
      </Card>

      {pendingRequests.length > 0 ? (
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Solicitudes Pendientes</h2>
            <p className="text-sm text-ink-500">Revisa y decide si deseas aceptar o rechazar a cada solicitante.</p>
          </div>

          {actionError ? <p className="text-sm font-medium text-red-600">{actionError}</p> : null}

          <ul className="space-y-3">
            {pendingRequests.map((requestUserId) => {
              const profile = profiles[requestUserId];
              const fullName = profile?.fullName ?? `Usuario ${requestUserId.slice(0, 8)}`;
              const avatarInitial = fullName.charAt(0).toUpperCase() || 'U';

              return (
                <li
                  key={requestUserId}
                  className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={fullName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-200 text-sm font-semibold text-ink-700">
                        {avatarInitial}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{fullName}</p>
                      <p className="text-xs text-ink-500">ID: {requestUserId}</p>
                    </div>
                  </div>

                  {isGroupAdmin ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        disabled={processingRequestUserId !== null}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => void processRequest(requestUserId, 'accept')}
                      >
                        {processingRequestUserId === requestUserId ? 'Procesando...' : 'Aceptar'}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={processingRequestUserId !== null}
                        onClick={() => void processRequest(requestUserId, 'reject')}
                      >
                        {processingRequestUserId === requestUserId ? 'Procesando...' : 'Rechazar'}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-ink-500">Solo el administrador puede gestionar solicitudes.</p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
