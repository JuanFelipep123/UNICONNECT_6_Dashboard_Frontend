import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'info' | 'success' | 'error';
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  push: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toastColors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#00284D', border: '#426088', icon: 'check_circle' },
  error:   { bg: '#ba1a1a', border: '#93000a', icon: 'error'         },
  info:    { bg: '#1b1c1c', border: '#43474e', icon: 'info'          },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, type: ToastType = 'info') => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    setToasts((t) => [{ id, message, type }, ...t]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const colors = toastColors[t.type];
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm text-white pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <span
                className="material-symbols-outlined flex-shrink-0"
                style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
              >
                {colors.icon}
              </span>
              <span className="leading-snug">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
