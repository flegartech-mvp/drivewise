import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      await fetchMe();
      navigate('/');
    } catch {
      setError('Napačni podatki za prijavo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-brand-400 font-bold text-3xl tracking-tight mb-1">DriveWise</div>
          <div className="text-surface-400 text-sm">Admin Dashboard</div>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm text-surface-300 mb-1">E-pošta</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-surface-300 mb-1">Geslo</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
              required
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button type="submit" className="btn-primary w-full justify-center py-2.5">
            Prijava
          </button>
        </form>
        <div className="mt-4 p-3 bg-surface-800 border border-surface-600 rounded-lg text-xs text-surface-400 text-center">
          Demo: <span className="text-surface-300">admin@drivewise.si</span> / <span className="text-surface-300">admin1234</span>
        </div>
      </div>
    </div>
  );
}
