import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@shared/components/ui/ToastProvider';
import { CAREERS, SEMESTERS, type ProfileSubject } from '../../domain/profile';
import { useProfile } from '../hooks/useProfile';
import { useAvailableSubjects } from '../hooks/useAvailableSubjects';

export function ProfilePage() {
  const toast = useToast();
  const {
    profile, subjects, loading, error,
    saving, saveError, reload,
    updateProfile, uploadAvatar,
    addSubject, removeSubject, clearSaveError,
  } = useProfile();

  // Editable fields
  const [career, setCareer] = useState('');
  const [semester, setSemester] = useState('');
  const [phone, setPhone] = useState('');
  const [dirty, setDirty] = useState(false);

  // Subjects panel
  const [subjectSearch, setSubjectSearch] = useState('');
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available subjects for adding
  const { subjects: availableSubjects, loading: loadingAvailable } = useAvailableSubjects(career || null);

  // Sync local state when profile loads
  useEffect(() => {
    if (profile) {
      setCareer(profile.career ?? '');
      setSemester(profile.semester ? String(profile.semester) : '');
      setPhone(profile.phone_number ?? '');
      setDirty(false);
    }
  }, [profile]);

  // Filter available subjects that the user doesn't have yet
  const suggestedSubjects = useMemo(() => {
    const currentIds = new Set(subjects.map((s) => s.id));
    let filtered = availableSubjects.filter((s) => !currentIds.has(s.id));
    if (subjectSearch.trim()) {
      const q = subjectSearch.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [availableSubjects, subjects, subjectSearch]);

  const handleFieldChange = useCallback((setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setter(e.target.value);
    setDirty(true);
  }, []);

  const handleSave = async () => {
    clearSaveError();
    const ok = await updateProfile({
      career: career || null,
      semester: semester ? Number(semester) : null,
      phone_number: phone || null,
    });
    if (ok) {
      setDirty(false);
      toast.push('Perfil actualizado correctamente.', 'success');
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await uploadAvatar(file);
    if (ok) toast.push('Avatar actualizado.', 'success');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddSubject = async (subject: ProfileSubject) => {
    setAddingIds((prev) => new Set(prev).add(subject.id));
    const ok = await addSubject(subject.id);
    setAddingIds((prev) => { const next = new Set(prev); next.delete(subject.id); return next; });
    if (!ok) toast.push('No se pudo agregar la materia.', 'error');
  };

  const handleRemoveSubject = async (subjectId: string) => {
    setRemovingIds((prev) => new Set(prev).add(subjectId));
    const ok = await removeSubject(subjectId);
    setRemovingIds((prev) => { const next = new Set(prev); next.delete(subjectId); return next; });
    if (!ok) toast.push('No se pudo eliminar la materia.', 'error');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3" style={{ color: '#73777f' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '24px' }}>progress_activity</span>
        <span className="text-sm">Cargando perfil...</span>
      </div>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ba1a1a' }}>error</span>
        <p className="text-sm" style={{ color: '#ba1a1a' }}>{error}</p>
        <button onClick={() => void reload()} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#00284D', color: '#fff' }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Header card ─────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid #e3e5ea' }}
      >
        {/* Banner */}
        <div style={{ height: '120px', background: 'linear-gradient(135deg, #00284D 0%, #003d7a 50%, #D4AF37 100%)' }} />

        {/* Avatar + name */}
        <div className="px-8 pb-6 -mt-14 flex items-end gap-6">
          <button
            type="button"
            onClick={handleAvatarClick}
            className="relative w-28 h-28 rounded-full border-4 flex-shrink-0 overflow-hidden group"
            style={{ borderColor: '#ffffff', background: '#e3e5ea', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined flex items-center justify-center w-full h-full" style={{ fontSize: '48px', color: '#73777f' }}>
                person
              </span>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>photo_camera</span>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleAvatarChange(e)} />

          <div className="pb-1">
            <h1 className="text-2xl font-bold font-serif" style={{ color: '#00132a' }}>
              {profile?.name ?? 'Estudiante'}
            </h1>
            {profile?.email && (
              <p className="text-sm mt-0.5" style={{ color: '#73777f' }}>{profile.email}</p>
            )}
            {profile?.career && (
              <p className="text-sm font-medium mt-1" style={{ color: '#00284D' }}>{profile.career}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile fields ──────────────────────────────────── */}
      <div
        className="rounded-2xl p-8 space-y-6"
        style={{ background: '#ffffff', border: '1px solid #e3e5ea' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#D4AF37' }}>edit</span>
          <h2 className="text-lg font-bold font-serif" style={{ color: '#00132a' }}>Información personal</h2>
        </div>

        {saveError && (
          <p className="text-sm px-4 py-2 rounded-lg" style={{ color: '#ba1a1a', background: '#fff8f7', border: '1px solid #ffdad6' }}>
            {saveError}
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {/* Career — read-only if already set */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#43474e' }}>Carrera</label>
            {profile?.career ? (
              <div
                className="w-full px-4 py-2.5 rounded-xl border text-sm flex items-center gap-2"
                style={{ borderColor: '#c3c6cf', background: '#f5f5f5', color: '#43474e', cursor: 'not-allowed' }}
              >
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '16px', color: '#73777f' }}>lock</span>
                <span>{profile.career}</span>
              </div>
            ) : (
              <select
                value={career}
                onChange={handleFieldChange(setCareer)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: '#c3c6cf', background: '#ffffff', color: '#00132a' }}
              >
                <option value="">Seleccionar carrera</option>
                {CAREERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            )}
            {profile?.career && (
              <p className="mt-1 text-[11px]" style={{ color: '#73777f' }}>
                La carrera se asigna durante el registro y no puede modificarse.
              </p>
            )}
          </div>

          {/* Semester */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#43474e' }}>Semestre</label>
            <select
              value={semester}
              onChange={handleFieldChange(setSemester)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: '#c3c6cf', background: '#ffffff', color: '#00132a' }}
            >
              <option value="">Seleccionar semestre</option>
              {SEMESTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Phone */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#43474e' }}>Teléfono</label>
            <div className="relative max-w-sm">
              <input
                type="tel"
                placeholder="Número de celular (10 dígitos)"
                value={phone}
                maxLength={10}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(onlyDigits);
                  setDirty(true);
                }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all pr-14"
                style={{ borderColor: phone.length > 0 && phone.length < 10 ? '#D4AF37' : '#c3c6cf', background: '#ffffff', color: '#00132a' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = phone.length > 0 && phone.length < 10 ? '#D4AF37' : '#c3c6cf'; }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono tabular-nums"
                style={{ color: phone.length === 10 ? '#28a745' : '#73777f' }}
              >
                {phone.length}/10
              </span>
            </div>
            {phone.length > 0 && phone.length < 10 && (
              <p className="mt-1 text-[11px]" style={{ color: '#D4AF37' }}>
                El número debe tener exactamente 10 dígitos.
              </p>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => void handleSave()}
            className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
            style={{
              background: dirty && !saving ? '#00284D' : '#c3c6cf',
              color: dirty && !saving ? '#ffffff' : '#73777f',
              cursor: dirty && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving && <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>progress_activity</span>}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* ── Subjects management ─────────────────────────────── */}
      <div
        className="rounded-2xl p-8 space-y-6"
        style={{ background: '#ffffff', border: '1px solid #e3e5ea' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#D4AF37' }}>menu_book</span>
          <h2 className="text-lg font-bold font-serif" style={{ color: '#00132a' }}>Mis materias</h2>
          <span className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#d3e3ff', color: '#001c39' }}>
            {subjects.length}
          </span>
        </div>

        {/* Current subjects */}
        {subjects.length === 0 ? (
          <div className="rounded-xl p-6 text-center border border-dashed" style={{ borderColor: '#c3c6cf', background: '#f9f9f9' }}>
            <span className="material-symbols-outlined mb-2" style={{ fontSize: '32px', color: '#73777f' }}>school</span>
            <p className="text-sm" style={{ color: '#73777f' }}>No tienes materias registradas.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => {
              const isRemoving = removingIds.has(s.id);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-full text-sm font-medium border transition-all"
                  style={{ background: '#f0f4ff', borderColor: '#c3c6cf', color: '#00284D', opacity: isRemoving ? 0.5 : 1 }}
                >
                  <span>{s.name}</span>
                  <button
                    type="button"
                    disabled={isRemoving}
                    onClick={() => void handleRemoveSubject(s.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                    title="Eliminar materia"
                  >
                    {isRemoving ? (
                      <span className="material-symbols-outlined animate-spin" style={{ fontSize: '14px', color: '#73777f' }}>progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ba1a1a' }}>close</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add subjects section */}
        <div className="border-t pt-5" style={{ borderColor: '#e3e5ea' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#43474e' }}>Agregar materias</h3>

          {!career ? (
            <p className="text-sm" style={{ color: '#73777f' }}>Selecciona tu carrera arriba para ver materias disponibles.</p>
          ) : (
            <>
              <div className="relative max-w-sm mb-3">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ fontSize: '18px', color: '#73777f' }}>
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar materia..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: '#c3c6cf', background: '#ffffff', color: '#00132a' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#c3c6cf'; }}
                />
              </div>

              {loadingAvailable ? (
                <div className="flex items-center gap-2" style={{ color: '#73777f' }}>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>progress_activity</span>
                  <span className="text-sm">Cargando materias...</span>
                </div>
              ) : suggestedSubjects.length === 0 ? (
                <p className="text-sm" style={{ color: '#73777f' }}>
                  {availableSubjects.length === 0 ? 'No hay materias disponibles para esta carrera.' : 'Todas las materias ya están agregadas o no hay coincidencias.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {suggestedSubjects.map((s) => {
                    const isAdding = addingIds.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={isAdding}
                        onClick={() => void handleAddSubject(s)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition-all"
                        style={{
                          background: '#ffffff',
                          borderColor: '#c3c6cf',
                          color: '#43474e',
                          opacity: isAdding ? 0.5 : 1,
                          cursor: isAdding ? 'not-allowed' : 'pointer',
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
            </>
          )}
        </div>
      </div>

      {/* ── Account info ────────────────────────────────────── */}
      <div
        className="rounded-2xl p-8 space-y-3"
        style={{ background: '#ffffff', border: '1px solid #e3e5ea' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#D4AF37' }}>info</span>
          <h2 className="text-lg font-bold font-serif" style={{ color: '#00132a' }}>Información de cuenta</h2>
        </div>

        <div className="grid gap-3 text-sm" style={{ color: '#43474e' }}>
          <div className="flex gap-2">
            <span className="font-semibold w-32 flex-shrink-0">ID de usuario:</span>
            <span className="font-mono text-xs" style={{ color: '#73777f' }}>{profile?.id}</span>
          </div>
          {profile?.email && (
            <div className="flex gap-2">
              <span className="font-semibold w-32 flex-shrink-0">Correo:</span>
              <span>{profile.email}</span>
            </div>
          )}
          {profile?.created_at && (
            <div className="flex gap-2">
              <span className="font-semibold w-32 flex-shrink-0">Miembro desde:</span>
              <span>{new Date(profile.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
