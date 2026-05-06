import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@shared/components/ui/Button';
import { Card } from '@shared/components/ui/Card';
import { Modal } from '@shared/components/ui/Modal';
import { useToast } from '@shared/components/ui/ToastProvider';
import { GroupCard } from '../components/GroupCard';
import { CreateGroupForm } from '../components/CreateGroupForm';
import { GroupSearchBar } from '../components/GroupSearchBar';
import { useUserGroups } from '../hooks/useUserGroups';
import { useCreateStudyGroup } from '../hooks/useCreateStudyGroup';
import { useUserSubjects } from '../hooks/useUserSubjects';
import type { StudyGroupCreatePayload } from '../../domain/groups';

export function GroupsListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Admin transfer notification state ──────────────────────────────────────
  const [pendingTransferNotification, setPendingTransferNotification] = useState<{
    groupId: string;
    fromUserId: string;
  } | null>(null);

  const handleAdminTransferRequested = useCallback(
    (payload: { groupId: string; fromUserId: string; toUserId: string }) => {
      setPendingTransferNotification({ groupId: payload.groupId, fromUserId: payload.fromUserId });
      toast.push('📨 Te han propuesto como nuevo administrador de un grupo. Revisa la notificación.', 'info');
    },
    [toast],
  );

  const { adminGroups, participantGroups, loading, error, reload } = useUserGroups({
    onAdminTransferRequested: handleAdminTransferRequested,
  });
  const { subjects, loading: loadingSubjects } = useUserSubjects();
  const { createGroup, isLoading: creating, error: createError, clearError } = useCreateStudyGroup();


  const openModal  = () => { clearError(); setShowCreateModal(true); };
  const closeModal = () => { clearError(); setShowCreateModal(false); };

  const handleCreate = async (payload: StudyGroupCreatePayload) => {
    const groupId = await createGroup(payload);
    if (groupId) {
      closeModal();
      toast.push('¡Grupo creado con éxito!', 'success');
      await reload();
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
            Cargando grupos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="font-serif font-bold leading-tight mb-2"
            style={{ fontSize: '32px', color: '#00132a', letterSpacing: '-0.01em' }}
          >
            Grupos de estudio
          </h1>
          <p className="text-base" style={{ color: '#43474e', maxWidth: '560px' }}>
            Gestiona tus comunidades de aprendizaje, colabora en investigaciones
            y coordina entregas académicas con tus pares y docentes.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
          style={{
            background: '#D4AF37',
            color: '#00284D',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#B8972F';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#D4AF37';
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add_circle
          </span>
          Nuevo grupo
        </button>
      </div>

      {/* Error banner */}
      {error ? (
        <Card className="text-sm font-medium" style={{ color: '#ba1a1a', borderColor: '#ffdad6', background: '#fff8f7' }}>
          {error}
        </Card>
      ) : null}

      {/* ── Admin groups section ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2
            className="font-serif font-semibold"
            style={{ fontSize: '22px', color: '#00132a' }}
          >
            Grupos administrados
          </h2>
          <span
            className="px-3 py-0.5 rounded-full text-xs font-bold"
            style={{ background: '#d3e3ff', color: '#001c39' }}
          >
            {adminGroups.length}
          </span>
        </div>

        {adminGroups.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center border border-dashed"
            style={{ borderColor: '#c3c6cf', background: '#f0eded' }}
          >
            <span
              className="material-symbols-outlined mb-3"
              style={{ fontSize: '40px', color: '#73777f' }}
            >
              groups
            </span>
            <p className="text-sm font-medium" style={{ color: '#43474e' }}>
              No administras ningún grupo todavía.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {adminGroups.map((group) => (
              <GroupCard key={group.id} group={group} accentColor="navy" />
            ))}
          </div>
        )}
      </section>

      {/* ── Search groups by subject ──────────────────────────── */}
      <GroupSearchBar />

      {/* ── Participant groups section ───────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2
            className="font-serif font-semibold"
            style={{ fontSize: '22px', color: '#00132a' }}
          >
            Grupos donde participas
          </h2>
          <span
            className="px-3 py-0.5 rounded-full text-xs font-bold"
            style={{ background: '#fed488', color: '#5d4201' }}
          >
            {participantGroups.length}
          </span>
        </div>

        {participantGroups.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center border border-dashed"
            style={{ borderColor: '#c3c6cf', background: '#f0eded' }}
          >
            <span
              className="material-symbols-outlined mb-3"
              style={{ fontSize: '40px', color: '#73777f' }}
            >
              person_add
            </span>
            <p className="text-sm font-medium" style={{ color: '#43474e' }}>
              Aún no participas en ningún grupo.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {participantGroups.map((group) => (
              <GroupCard key={group.id} group={group} accentColor="gold" />
            ))}
          </div>
        )}
      </section>


      {/* ── Create group modal ───────────────────────────────────── */}
      <Modal isOpen={showCreateModal} onClose={closeModal} title="Crear grupo de estudio">
        {loadingSubjects ? (
          <p className="text-sm" style={{ color: '#73777f' }}>Cargando materias...</p>
        ) : (
          <CreateGroupForm
            subjects={subjects}
            loading={creating}
            error={createError}
            onSubmit={handleCreate}
          />
        )}
      </Modal>

      {/* ── Admin transfer notification modal ────────────────────── */}
      <Modal
        isOpen={pendingTransferNotification !== null}
        onClose={() => setPendingTransferNotification(null)}
        title="📨 Solicitud de administración"
        footer={
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPendingTransferNotification(null)}
              className="flex-1"
            >
              Ahora no
            </Button>
            <Button
              type="button"
              onClick={() => {
                const groupId = pendingTransferNotification?.groupId;
                setPendingTransferNotification(null);
                if (groupId) navigate(`/groups/${groupId}`);
              }}
              className="flex-1"
            >
              Ir al grupo
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm" style={{ color: '#43474e' }}>
            El administrador de uno de tus grupos te ha seleccionado como posible nuevo administrador.
          </p>
          <p className="text-sm" style={{ color: '#73777f' }}>
            Ve al grupo para aceptar o rechazar la solicitud. Si no respondes, el administrador actual no podrá salir del grupo.
          </p>
        </div>
      </Modal>
    </div>
  );
}
