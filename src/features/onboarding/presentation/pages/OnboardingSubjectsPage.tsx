import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@shared/store/authStore';
import { profileHttpService } from '@features/profile/infrastructure/profileHttpService';
import type { ProfileSubject } from '@features/profile/domain/profile';
import { completeOnboarding, OnboardingApiError } from '../../infrastructure/onboardingService';

export function OnboardingSubjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setSession = useAuthStore((s) => s.setSession);

  // Params passed from step-1
  const stateParams = (location.state ?? {}) as { career?: string; semester?: string; phoneNumber?: string };
  const career = stateParams.career ?? '';

  // Subjects state
  const [currentSubjects, setCurrentSubjects] = useState<ProfileSubject[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<ProfileSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [addError, setAddError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  // Load profile subjects + available subjects
  useEffect(() => {
    if (!token || !userId) return;
    (async () => {
      setLoadingSubjects(true);
      const [profileRes, availableRes] = await Promise.all([
        profileHttpService.getProfileSubjects(userId, token),
        profileHttpService.getAvailableSubjects(token, { career: career || undefined, limit: 100 }),
      ]);
      if (profileRes.success) setCurrentSubjects(profileRes.data ?? []);
      if (availableRes.success) setAvailableSubjects(availableRes.data ?? []);
      setLoadingSubjects(false);
    })();
  }, [career, token, userId]);

  // Suggested: available not yet in current, filtered by search
  const suggestedSubjects = useMemo(() => {
    const currentIds = new Set(currentSubjects.map((s) => s.id));
    let filtered = availableSubjects.filter((s) => !currentIds.has(s.id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [availableSubjects, currentSubjects, searchQuery]);

  const emptyMessage = useMemo(() => {
    if (!career) return 'No se pudo identificar tu carrera. Regresa al paso anterior.';
    if (availableSubjects.length === 0) return 'No hay materias registradas para tu carrera.';
    return 'Todas las materias ya están agregadas o no hay coincidencias.';
  }, [career, availableSubjects.length]);

  const handleAddSubject = useCallback(async (subject: ProfileSubject) => {
    if (!token || !userId) return;
    setAddingIds((p) => new Set(p).add(subject.id));
    setAddError(null);

    const res = await profileHttpService.addSubjectToProfile(userId, subject.id, token);
    setAddingIds((p) => { const n = new Set(p); n.delete(subject.id); return n; });

    if (res.success) {
      setCurrentSubjects((p) => [...p, subject]);
    } else {
      setAddError(res.error ?? 'No se pudo agregar la materia.');
    }
  }, [token, userId]);

  const handleRemoveSubject = useCallback(async (subjectId: string) => {
    if (!token || !userId) return;
    setRemovingIds((p) => new Set(p).add(subjectId));

    const res = await profileHttpService.removeSubjectFromProfile(userId, subjectId, token);
    setRemovingIds((p) => { const n = new Set(p); n.delete(subjectId); return n; });

    if (res.success) {
      setCurrentSubjects((p) => p.filter((s) => s.id !== subjectId));
    }
  }, [token, userId]);

  const handleFinish = useCallback(async () => {
    if (currentSubjects.length === 0) {
      setFinishError('Debes agregar al menos una materia para continuar.');
      return;
    }
    if (!token || !userId) { navigate('/login'); return; }

    setIsFinishing(true);
    setFinishError(null);

    try {
      await completeOnboarding(token, false);
      // Mark onboarding as done in the store
      setSession({ userId, token, needsOnboarding: false });
      navigate('/groups', { replace: true });
    } catch (err) {
      if (err instanceof OnboardingApiError && err.status === 401) {
        clearSession();
        navigate('/login');
        return;
      }
      setFinishError('Se guardaron tus materias, pero no se pudo cerrar el onboarding. Intenta nuevamente.');
    } finally {
      setIsFinishing(false);
    }
  }, [clearSession, currentSubjects.length, navigate, setSession, token, userId]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F3F5F7' }}>
      <div className="w-full max-w-lg mx-auto flex flex-col flex-1 px-6 pt-8 pb-10">

        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/onboarding/step-1')}
            className="flex items-center gap-1 mb-4 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: '#7A8EA8' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
            Volver
          </button>

          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7A8EA8' }}>
            TUS MATERIAS
          </p>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium" style={{ color: '#7A8EA8' }}>PASO 2 DE 2</p>
          </div>
          <div className="flex gap-2 mb-5">
            <div className="h-1.5 flex-1 rounded-full" style={{ background: '#C8A04D' }} />
            <div className="h-1.5 flex-1 rounded-full" style={{ background: '#C8A04D' }} />
          </div>
          <p className="text-sm" style={{ color: '#4C5E76' }}>
            Selecciona las materias que estás cursando actualmente.
            {career && <span className="font-semibold"> ({career})</span>}
          </p>
        </div>

        {/* Current subjects */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#062E57' }}>Mis materias</h2>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: '#D3E3FF', color: '#001C39' }}
            >
              {currentSubjects.length}
            </span>
          </div>

          {currentSubjects.length === 0 ? (
            <div
              className="rounded-xl p-4 text-center border border-dashed"
              style={{ borderColor: '#D4DBE5', background: '#FAFAFA' }}
            >
              <p className="text-sm" style={{ color: '#7A8EA8' }}>Aún no has agregado materias.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentSubjects.map((s) => {
                const isRemoving = removingIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-sm font-medium border transition-all"
                    style={{ background: '#EAF2FF', borderColor: '#C3C6CF', color: '#00284D', opacity: isRemoving ? 0.5 : 1 }}
                  >
                    <span>{s.name}</span>
                    <button
                      type="button"
                      disabled={isRemoving}
                      onClick={() => void handleRemoveSubject(s.id)}
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      {isRemoving ? (
                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '13px', color: '#73777f' }}>progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#BA1A1A' }}>close</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add subjects */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: '#062E57' }}>Agregar materias</h2>

          {/* Search */}
          <div className="relative mb-3">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ fontSize: '18px', color: '#7A8EA8' }}>
              search
            </span>
            <input
              type="text"
              placeholder="Buscar materia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: '#D4DBE5', background: '#ffffff', color: '#062E57' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#C8A04D'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#D4DBE5'; }}
            />
          </div>

          {addError && (
            <p className="mb-2 text-sm" style={{ color: '#BA1A1A' }}>{addError}</p>
          )}

          {loadingSubjects ? (
            <div className="flex items-center gap-2 py-4" style={{ color: '#7A8EA8' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>progress_activity</span>
              <span className="text-sm">Cargando materias...</span>
            </div>
          ) : suggestedSubjects.length === 0 ? (
            <p className="text-sm py-4" style={{ color: '#7A8EA8' }}>{emptyMessage}</p>
          ) : (
            <div className="flex flex-wrap gap-2 overflow-y-auto" style={{ maxHeight: '220px' }}>
              {suggestedSubjects.map((s) => {
                const isAdding = addingIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isAdding}
                    onClick={() => void handleAddSubject(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all hover:bg-blue-50"
                    style={{
                      background: '#ffffff', borderColor: '#D4DBE5', color: '#43474E',
                      opacity: isAdding ? 0.5 : 1, cursor: isAdding ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isAdding ? (
                      <span className="material-symbols-outlined animate-spin" style={{ fontSize: '14px' }}>progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#28a745' }}>add</span>
                    )}
                    {s.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Finish */}
        <div className="pt-6">
          {finishError && (
            <div className="mb-3 rounded-xl px-4 py-3 text-sm" style={{ background: '#FFF0F0', border: '1px solid #FFB4AB', color: '#BA1A1A' }}>
              {finishError}
            </div>
          )}
          <button
            type="button"
            disabled={isFinishing}
            onClick={() => void handleFinish()}
            className="w-full py-4 rounded-xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: '#032D5A', color: '#D7A548', opacity: isFinishing ? 0.7 : 1, cursor: isFinishing ? 'not-allowed' : 'pointer' }}
          >
            {isFinishing && <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>}
            {isFinishing ? 'Finalizando...' : 'Finalizar'}
          </button>
        </div>
      </div>
    </div>
  );
}
