import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/store/authStore';
import {
  autosaveOnboardingContact,
  getOnboardingPrograms,
  OnboardingApiError,
  submitOnboardingStepOne,
  type OnboardingProgramOption,
  type OnboardingStepOneValidationErrors,
} from '../../infrastructure/onboardingService';

const SEMESTERS = Array.from({ length: 10 }, (_, i) => i + 1);

export function OnboardingStepOnePage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Form state
  const [career, setCareer] = useState('');
  const [isCareerSelected, setIsCareerSelected] = useState(false);
  const [semester, setSemester] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [programOptions, setProgramOptions] = useState<OnboardingProgramOption[]>([]);
  const [showProgramsList, setShowProgramsList] = useState(false);
  const [showSemestersList, setShowSemestersList] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<OnboardingStepOneValidationErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const lastSavedPhoneRef = useRef('');
  const programsListRef = useRef<HTMLDivElement>(null);
  const semesterListRef = useRef<HTMLDivElement>(null);

  const normalizedCareer = useMemo(() => career.trim(), [career]);
  const normalizedPhone = useMemo(() => phoneNumber.replace(/\D/g, '').slice(0, 10), [phoneNumber]);
  const phoneDigitsCount = normalizedPhone.length;

  // Load programs with debounce
  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(async () => {
      setLoadingPrograms(true);
      try {
        const options = await getOnboardingPrograms(token, normalizedCareer, 20);
        setProgramOptions(options);
      } catch (err) {
        if (err instanceof OnboardingApiError && err.status === 401) { clearSession(); navigate('/login'); return; }
        setProgramOptions([]);
      } finally { setLoadingPrograms(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [clearSession, navigate, normalizedCareer, token]);

  // Autosave phone with debounce
  useEffect(() => {
    if (!token || !normalizedPhone || normalizedPhone === lastSavedPhoneRef.current) return;
    const timer = setTimeout(async () => {
      try { await autosaveOnboardingContact(token, normalizedPhone); lastSavedPhoneRef.current = normalizedPhone; } catch { /* non-blocking */ }
    }, 700);
    return () => clearTimeout(timer);
  }, [normalizedPhone, token]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (programsListRef.current && !programsListRef.current.contains(e.target as Node)) setShowProgramsList(false);
      if (semesterListRef.current && !semesterListRef.current.contains(e.target as Node)) setShowSemestersList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCareerChange = (value: string) => {
    setCareer(value);
    setIsCareerSelected(false);
    setShowProgramsList(true);
    setShowSemestersList(false);
    setFormErrors((p) => ({ ...p, career: undefined }));
  };

  const handleSelectCareer = (name: string) => {
    setCareer(name);
    setIsCareerSelected(true);
    setShowProgramsList(false);
    setFormErrors((p) => ({ ...p, career: undefined }));
  };

  const handleSelectSemester = (value: number) => {
    setSemester(value);
    setShowSemestersList(false);
    setFormErrors((p) => ({ ...p, semester: undefined }));
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(digits);
    setFormErrors((p) => ({ ...p, phone_number: undefined }));
  };

  const handleContinue = useCallback(async () => {
    if (!token) { navigate('/login'); return; }

    const nextErrors: OnboardingStepOneValidationErrors = {};
    if (!normalizedCareer) nextErrors.career = 'Debes seleccionar tu carrera.';
    else if (!isCareerSelected) nextErrors.career = 'Debes elegir una carrera de la lista.';
    if (!semester) nextErrors.semester = 'Debes seleccionar tu semestre.';
    if (!normalizedPhone) nextErrors.phone_number = 'Debes ingresar un número de contacto.';
    else if (phoneDigitsCount < 10) nextErrors.phone_number = 'El número debe contener exactamente 10 dígitos.';

    setFormErrors(nextErrors);
    setGlobalError(null);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      await submitOnboardingStepOne(token, {
        career: normalizedCareer,
        semester: semester as number,
        phoneNumber: normalizedPhone,
      });
      navigate('/onboarding/subjects', { state: { career: normalizedCareer, semester: String(semester), phoneNumber: normalizedPhone } });
    } catch (err) {
      if (err instanceof OnboardingApiError) {
        if (err.status === 401) { clearSession(); navigate('/login'); return; }
        if (err.validationErrors) {
          setFormErrors({
            career: err.validationErrors.career,
            semester: err.validationErrors.semester,
            phone_number: err.validationErrors.phone_number,
          });
        }
        setGlobalError(err.message);
      } else {
        setGlobalError('No fue posible guardar el paso 1. Intenta nuevamente.');
      }
    } finally { setIsSubmitting(false); }
  }, [career, clearSession, isCareerSelected, navigate, normalizedCareer, normalizedPhone, phoneDigitsCount, semester, token]);

  const inputBase = {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1.5px solid #D4DBE5', background: '#ffffff',
    fontSize: '15px', color: '#062E57', outline: 'none',
  } as React.CSSProperties;

  const errorStyle = { color: '#BA1A1A', fontSize: '13px', marginTop: '4px' } as React.CSSProperties;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F3F5F7' }}>
      <div className="w-full max-w-lg mx-auto flex flex-col flex-1 px-6 pt-8 pb-10">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7A8EA8' }}>
            ACADÉMICO Y PERSONAL
          </p>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm font-medium" style={{ color: '#7A8EA8' }}>PASO 1 DE 2</p>
          </div>
          <div className="flex gap-2 mb-5">
            <div className="h-1.5 flex-1 rounded-full" style={{ background: '#C8A04D' }} />
            <div className="h-1.5 flex-1 rounded-full" style={{ background: '#D4DBE5' }} />
          </div>

          <p className="text-sm" style={{ color: '#4C5E76' }}>
            Para comenzar, cuéntanos un poco sobre tu situación académica y personal.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5 flex-1">

          {/* Career */}
          <div ref={programsListRef} className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#43474e' }}>
              Carrera
            </label>
            <div
              className="flex items-center gap-2 rounded-xl border transition-all"
              style={{ ...inputBase, padding: '0 12px', border: showProgramsList ? '1.5px solid #C8A04D' : '1.5px solid #D4DBE5' }}
            >
              <input
                type="text"
                placeholder="Selecciona tu carrera (ej. Ingeniería de Sistemas)"
                value={career}
                onChange={(e) => handleCareerChange(e.target.value)}
                onFocus={() => { setShowProgramsList(true); setShowSemestersList(false); }}
                className="flex-1 py-3 outline-none bg-transparent text-sm"
                style={{ color: '#062E57' }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => { setShowProgramsList((p) => !p); setShowSemestersList(false); }}
                className="flex-shrink-0"
              >
                {loadingPrograms ? (
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px', color: '#C8A04D' }}>progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#C8A04D' }}>
                    {showProgramsList ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                  </span>
                )}
              </button>
            </div>

            {showProgramsList && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 shadow-lg"
                style={{ background: '#ffffff', border: '1.5px solid #D4DBE5', maxHeight: '200px', overflowY: 'auto' }}
              >
                {programOptions.length === 0 ? (
                  <p className="px-4 py-3 text-sm" style={{ color: '#7A8EA8' }}>No existen programas para la búsqueda actual.</p>
                ) : (
                  programOptions.map((item, i) => (
                    <button
                      key={`${item.name}-${i}`}
                      type="button"
                      onClick={() => handleSelectCareer(item.name)}
                      className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-blue-50"
                      style={{ color: '#062E57', borderBottom: i < programOptions.length - 1 ? '1px solid #F0F4F8' : 'none' }}
                    >
                      {item.name}
                    </button>
                  ))
                )}
              </div>
            )}
            {formErrors.career && <p style={errorStyle}>{formErrors.career}</p>}
          </div>

          {/* Semester */}
          <div ref={semesterListRef} className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#43474e' }}>
              Semestre
            </label>
            <button
              type="button"
              onClick={() => { setShowSemestersList((p) => !p); setShowProgramsList(false); }}
              className="w-full flex items-center justify-between rounded-xl transition-all text-sm text-left"
              style={{
                ...inputBase,
                border: showSemestersList ? '1.5px solid #C8A04D' : '1.5px solid #D4DBE5',
                color: semester ? '#062E57' : '#6B798F',
              }}
            >
              <span>{semester ? `Semestre ${semester}` : 'Selecciona tu semestre (ej. 5)'}</span>
              <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px', color: '#C8A04D' }}>
                {showSemestersList ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>

            {showSemestersList && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 shadow-lg"
                style={{ background: '#ffffff', border: '1.5px solid #D4DBE5', maxHeight: '200px', overflowY: 'auto' }}
              >
                {SEMESTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectSemester(s)}
                    className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-blue-50"
                    style={{
                      color: semester === s ? '#C8A04D' : '#062E57',
                      fontWeight: semester === s ? '600' : '400',
                      borderBottom: s < 10 ? '1px solid #F0F4F8' : 'none',
                    }}
                  >
                    Semestre {s}
                  </button>
                ))}
              </div>
            )}
            {formErrors.semester && <p style={errorStyle}>{formErrors.semester}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#43474e' }}>
              Teléfono de contacto
            </label>
            <div
              className="flex items-center gap-2 rounded-xl border transition-all"
              style={{ ...inputBase, padding: '0 12px', border: phoneNumber && phoneDigitsCount < 10 ? '1.5px solid #D4AF37' : '1.5px solid #D4DBE5' }}
            >
              <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px', color: '#C8A04D' }}>phone</span>
              <input
                type="tel"
                placeholder="Ej. 3001234567"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onFocus={() => { setShowProgramsList(false); setShowSemestersList(false); }}
                maxLength={10}
                className="flex-1 py-3 outline-none bg-transparent text-sm"
                style={{ color: '#062E57' }}
              />
              <span
                className="text-xs font-mono tabular-nums flex-shrink-0"
                style={{ color: phoneDigitsCount === 10 ? '#28a745' : '#7A8EA8' }}
              >
                {phoneDigitsCount}/10
              </span>
            </div>
            {phoneNumber && phoneDigitsCount < 10 && (
              <p style={{ ...errorStyle, color: '#D4AF37' }}>El número debe contener exactamente 10 dígitos.</p>
            )}
            {formErrors.phone_number && <p style={errorStyle}>{formErrors.phone_number}</p>}
          </div>

          {globalError && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#FFF0F0', border: '1px solid #FFB4AB', color: '#BA1A1A' }}>
              {globalError}
            </div>
          )}
        </div>

        {/* Continue button */}
        <div className="pt-8">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleContinue()}
            className="w-full py-4 rounded-xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: '#032D5A', color: '#D7A548', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting && (
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>
            )}
            {isSubmitting ? 'Guardando...' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
