import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@shared/components/ui/Button';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { useAuthStore } from '@shared/store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState('admin@uniconnect.com');
  const [password, setPassword] = useState('');

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    // Placeholder de login web: cuando conectes auth real, solo remplaza este bloque.
    setSession({
      userId: 'web-admin-user',
      token: 'fake-token-for-local-dashboard',
    });

    navigate('/groups', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-ink-900">Ingresar al Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">Adaptacion web sobre la logica de UniConnect Mobile.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input label="Correo" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input
            label="Contrasena"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" className="w-full">
            Continuar
          </Button>
        </form>
      </Card>
    </div>
  );
}
