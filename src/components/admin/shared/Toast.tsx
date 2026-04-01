import { useState, useCallback, useRef, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const toastColors: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
  error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
  info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
};

const toastIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  function ToastContainer() {
    return (
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => {
          const c = toastColors[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                background: c.bg, border: `1px solid ${c.border}`,
                borderLeft: `4px solid ${c.border}`,
                borderRadius: 8, padding: '12px 16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, fontWeight: 600, color: c.text,
                pointerEvents: 'auto', cursor: 'pointer',
                animation: 'toast-in 0.3s ease',
                minWidth: 240, maxWidth: 400,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif',
              }}
              onClick={() => removeToast(toast.id)}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{toastIcons[toast.type]}</span>
              <span>{toast.message}</span>
            </div>
          );
        })}
        <style>{`
          @keyframes toast-in {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }

  return { showToast, ToastContainer };
}
