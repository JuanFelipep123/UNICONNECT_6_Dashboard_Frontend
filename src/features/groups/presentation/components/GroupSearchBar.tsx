import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@shared/components/ui/ToastProvider';
import type { Subject, StudyGroup } from '../../domain/groups';
import { useGroupSearch } from '../hooks/useGroupSearch';

export function GroupSearchBar() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    subjects,
    selectedSubject,
    groups,
    loadingSubjects,
    subjectsError,
    status,
    error,
    loadSubjects,
    selectSubject,
    searchGroups,
    resetResults,
    joinGroup,
  } = useGroupSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Load subjects on mount
  useEffect(() => {
    void loadSubjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search groups when a subject is selected / deselected
  useEffect(() => {
    if (selectedSubject) {
      void searchGroups(selectedSubject.id);
    } else {
      resetResults();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject?.id]);

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSubject = (subject: Subject) => {
    selectSubject(selectedSubject?.id === subject.id ? null : subject);
    setSearchQuery('');
  };

  const handleJoin = async (groupId: string) => {
    setJoiningId(groupId);
    const result = await joinGroup(groupId);
    setJoiningId(null);

    if (!result.success) {
      toast.push(result.error ?? 'No se pudo enviar la solicitud.', 'error');
      return;
    }

    setPendingIds((prev) => new Set(prev).add(groupId));
    toast.push('¡Solicitud enviada! El administrador debe aceptarla para que puedas acceder.', 'success');
  };

  const getMemberCount = (group: StudyGroup): number => {
    // Try member_count first, then fall back to members array length
    if (typeof group.member_count === 'number') return group.member_count;
    if (Array.isArray(group.members)) return group.members.length;
    return 0;
  };

  const getGroupStatus = (group: StudyGroup): 'member' | 'pending' | 'available' => {
    if (group.is_member) return 'member';
    if (pendingIds.has(group.id)) return 'pending';
    return 'available';
  };

  return (
    <section className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <h2
          className="font-serif font-semibold"
          style={{ fontSize: '22px', color: '#00132a' }}
        >
          Buscar grupos por materia
        </h2>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '20px', color: '#D4AF37' }}
        >
          search
        </span>
      </div>

      {/* Subject search input */}
      <div className="relative max-w-md">
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ fontSize: '20px', color: '#73777f' }}
        >
          search
        </span>
        <input
          type="text"
          placeholder="Filtrar materia..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
          style={{ borderColor: '#c3c6cf', background: '#ffffff', color: '#00132a' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#c3c6cf'; }}
        />
      </div>

      {/* Subject chips */}
      {loadingSubjects ? (
        <div className="flex items-center gap-2" style={{ color: '#73777f' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>
            progress_activity
          </span>
          <span className="text-sm">Cargando materias...</span>
        </div>
      ) : subjectsError ? (
        <p className="text-sm" style={{ color: '#ba1a1a' }}>{subjectsError}</p>
      ) : filteredSubjects.length === 0 ? (
        <p className="text-sm" style={{ color: '#73777f' }}>
          {subjects.length === 0
            ? 'No tienes materias registradas en tu perfil.'
            : 'Sin coincidencias para tu búsqueda.'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filteredSubjects.map((subject) => {
            const isSelected = selectedSubject?.id === subject.id;
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => handleSelectSubject(subject)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold border transition-all"
                style={{
                  background: isSelected ? '#00284D' : '#f0f4ff',
                  color: isSelected ? '#ffffff' : '#00284D',
                  borderColor: isSelected ? '#00284D' : '#c3c6cf',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,40,77,0.18)' : 'none',
                }}
              >
                {subject.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Results area */}
      {selectedSubject && (
        <div className="space-y-4">
          {/* Status line */}
          <div className="flex items-center gap-2">
            {status === 'loading' && (
              <span
                className="material-symbols-outlined animate-spin"
                style={{ fontSize: '16px', color: '#73777f' }}
              >
                progress_activity
              </span>
            )}
            <p className="text-sm font-medium" style={{ color: '#43474e' }}>
              {status === 'loading' ? 'Buscando grupos...' : (
                <>
                  Grupos disponibles para{' '}
                  <span style={{ color: '#00284D', fontWeight: 700 }}>{selectedSubject.name}</span>
                </>
              )}
            </p>
          </div>

          {status === 'error' && (
            <p className="text-sm px-4 py-3 rounded-xl" style={{ color: '#ba1a1a', background: '#fff8f7', border: '1px solid #ffdad6' }}>
              {error}
            </p>
          )}

          {status === 'empty' && (
            <div
              className="rounded-xl p-8 text-center border border-dashed"
              style={{ borderColor: '#c3c6cf', background: '#f9f9f9' }}
            >
              <span className="material-symbols-outlined mb-2" style={{ fontSize: '36px', color: '#73777f' }}>
                search_off
              </span>
              <p className="text-sm" style={{ color: '#73777f' }}>
                No hay grupos disponibles para esta materia todavía.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => {
                const groupStatus = getGroupStatus(group);
                const isJoining = joiningId === group.id;
                const memberCount = getMemberCount(group);

                return (
                  <div
                    key={group.id}
                    className="rounded-2xl border flex flex-col overflow-hidden transition-shadow hover:shadow-md"
                    style={{ borderColor: '#e3e5ea', background: '#ffffff' }}
                  >
                    {/* Color stripe */}
                    <div style={{ height: '4px', background: '#D4AF37' }} />

                    <div className="p-5 flex flex-col gap-3 flex-1">
                      {/* Name + badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="font-semibold leading-snug"
                          style={{ fontSize: '15px', color: '#00132a' }}
                        >
                          {group.name}
                        </h3>
                        {groupStatus === 'member' && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: '#d3e3ff', color: '#001c39' }}
                          >
                            Miembro
                          </span>
                        )}
                        {groupStatus === 'pending' && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: '#fff3cd', color: '#856404' }}
                          >
                            Pendiente
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {group.description && (
                        <p className="text-sm line-clamp-2" style={{ color: '#43474e' }}>
                          {group.description}
                        </p>
                      )}

                      {/* Meta: member count + subject */}
                      <div className="flex items-center gap-4 text-xs" style={{ color: '#73777f' }}>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
                          {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                        </span>
                        {group.subject?.name && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>book</span>
                            {group.subject.name}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-auto pt-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/groups/${group.id}`)}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                          style={{ borderColor: '#c3c6cf', color: '#43474e', background: '#f5f6fa' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#e8eaf0'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#f5f6fa'; }}
                        >
                          Ver detalle
                        </button>

                        {groupStatus === 'available' && (
                          <button
                            type="button"
                            disabled={isJoining}
                            onClick={() => handleJoin(group.id)}
                            className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                            style={{
                              background: isJoining ? '#a8b4c0' : '#00284D',
                              color: '#ffffff',
                              cursor: isJoining ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => { if (!isJoining) e.currentTarget.style.background = '#001c39'; }}
                            onMouseLeave={(e) => { if (!isJoining) e.currentTarget.style.background = '#00284D'; }}
                          >
                            {isJoining ? (
                              <>
                                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '14px' }}>
                                  progress_activity
                                </span>
                                Enviando...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                  person_add
                                </span>
                                Unirme
                              </>
                            )}
                          </button>
                        )}

                        {groupStatus === 'pending' && (
                          <div
                            className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5"
                            style={{ background: '#fff8e1', color: '#856404', border: '1px solid #fcd34d' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                            En espera
                          </div>
                        )}

                        {groupStatus === 'member' && (
                          <button
                            type="button"
                            onClick={() => navigate(`/groups/${group.id}`)}
                            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{ background: '#d3e3ff', color: '#001c39' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#b8d0f7'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#d3e3ff'; }}
                          >
                            Ir al grupo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
