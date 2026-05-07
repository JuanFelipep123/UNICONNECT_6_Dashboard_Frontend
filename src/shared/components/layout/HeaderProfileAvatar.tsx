import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@shared/store/authStore';
import { API_BASE_URL } from '@shared/services/api/apiClient';

interface ProfileMini {
  name?: string;
  avatar_url?: string | null;
}

const normalizeUrl = (val: unknown): string | null => {
  if (typeof val !== 'string' || !val.trim()) return null;
  const t = val.trim();
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return t.startsWith('/') ? `${origin}${t}` : `${origin}/${t}`;
};

export function HeaderProfileAvatar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const [mini, setMini] = useState<ProfileMini | null>(null);

  useEffect(() => {
    if (!token || !userId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json() as Record<string, unknown>;
        const data = (json.data && typeof json.data === 'object' ? json.data : json) as Record<string, unknown>;
        setMini({
          name: (data.name ?? data.full_name ?? data.fullName ?? '') as string || undefined,
          avatar_url: normalizeUrl(data.avatar_url ?? data.avatarUrl ?? data.avatar),
        });
      } catch { /* ignore */ }
    })();
  }, [token, userId]);

  const isActive = location.pathname === '/profile';

  return (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all"
      style={{
        background: isActive ? 'rgba(0,40,77,0.08)' : 'transparent',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(0,40,77,0.05)'; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      title="Ver perfil"
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{
          background: mini?.avatar_url ? 'transparent' : '#d3e3ff',
          border: isActive ? '2px solid #D4AF37' : '2px solid transparent',
        }}
      >
        {mini?.avatar_url ? (
          <img src={mini.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00284D' }}>person</span>
        )}
      </div>

      {/* Name */}
      {mini?.name && (
        <span
          className="text-sm font-medium hidden lg:block max-w-[120px] truncate"
          style={{ color: '#00284D' }}
        >
          {mini.name}
        </span>
      )}
    </button>
  );
}
