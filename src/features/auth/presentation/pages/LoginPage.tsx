import { AlertCircle, Info } from 'lucide-react';
import { useAuthLogin } from '../../hooks/useAuthLogin';

const LOGIN_COLORS = {
  background: '#002147',
  white: '#FFFFFF',
  card: '#F7F7F7',
  darkButton: '#03254C',
  gold: '#C6A96A',
  subtitle: '#A9B7C8',
  muted: '#6B7280',
  warning: '#B08D57',
  error: '#B00020',
};

export function LoginPage() {
  const { canLogin, errorMessage, isLoading, handleLogin, loginUnavailableReason } = useAuthLogin();

  return (
    <div className="flex min-h-screen flex-col justify-between" style={{ backgroundColor: LOGIN_COLORS.background }}>
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-white/10">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-2xl font-bold text-[#002147]">
            UC
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white">UniConnect</h1>
        <p className="mt-3 text-lg" style={{ color: LOGIN_COLORS.subtitle }}>
          Conecta con tu comunidad universitaria
        </p>
      </section>

      <section className="w-full rounded-t-[30px] px-6 pb-10 pt-8" style={{ backgroundColor: LOGIN_COLORS.card }}>
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-center text-4xl font-bold" style={{ color: LOGIN_COLORS.darkButton }}>
            Bienvenido
          </h2>
          <p className="mt-2 text-center text-sm leading-6" style={{ color: LOGIN_COLORS.muted }}>
            Inicia sesion con tu correo institucional para acceder a la plataforma.
          </p>

          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={!canLogin || isLoading}
            className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-lg font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: LOGIN_COLORS.darkButton }}
          >
            {isLoading ? 'Redirigiendo...' : 'Iniciar sesion con Google'}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm" style={{ color: LOGIN_COLORS.warning }}>
            <Info size={16} />
            <span>
              Solo correos <strong>@ucaldas.edu.co</strong>
            </span>
          </div>

          {loginUnavailableReason ? (
            <p className="mt-4 text-center text-xs" style={{ color: LOGIN_COLORS.error }}>
              {loginUnavailableReason}
            </p>
          ) : null}

          {errorMessage ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
