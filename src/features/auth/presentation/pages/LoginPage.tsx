import { AlertCircle, Info } from 'lucide-react';
import { useAuthLogin } from '../../hooks/useAuthLogin';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.97 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z" />
    </svg>
  );
}

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
            {isLoading ? 'Redirigiendo...' : <><GoogleIcon />Iniciar sesion con Google</>}
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
