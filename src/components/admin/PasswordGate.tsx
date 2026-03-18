import { useState, useEffect, type ReactNode } from 'react';

const ADMIN_PASSWORD = 'pickypic2020';
const STORAGE_KEY = 'pickypic-admin-auth';

interface PasswordGateProps {
  children: ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#101112',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        로딩 중...
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#101112',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        background: '#1b1c1e',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '8px',
            letterSpacing: '0.05em',
          }}>
            PICKYPIC 관리자
          </h1>
          <p style={{ fontSize: '14px', color: '#888' }}>
            관리자 비밀번호를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '16px',
              background: '#2a2b2d',
              border: error ? '1px solid #e53e3e' : '1px solid #3a3b3d',
              borderRadius: '8px',
              color: '#fff',
              outline: 'none',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ fontSize: '13px', color: '#e53e3e', marginBottom: '12px' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 600,
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
