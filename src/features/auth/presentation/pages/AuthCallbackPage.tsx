import { Link } from 'react-router-dom';
import { useAuthCallback } from '../../hooks/useAuthCallback';

export function AuthCallbackPage() {
  const { isLoading, errorMessage } = useAuthCallback();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#002147] p-6 text-white">
        <p className="text-lg font-semibold">Validando autenticacion...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#002147] p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-[#03254C]">No se pudo iniciar sesion</h1>
          <p className="mt-4 text-sm text-gray-600">{errorMessage}</p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-xl bg-[#03254C] px-5 py-3 text-sm font-semibold text-white"
          >
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
