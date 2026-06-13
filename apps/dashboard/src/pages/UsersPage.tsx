import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { SectionHeader, LoadingState, ErrorState, Badge } from '../components/ui';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { trips: number; vehicles: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.users()
      .then((r) => setUsers(r.data))
      .catch(() => setError('Napaka pri nalaganju uporabnikov.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="p-8"><ErrorState message={error} /></div>;

  return (
    <div className="p-8">
      <SectionHeader title="Uporabniki" sub={`${users.length} registriranih uporabnikov`} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-surface-400 border-b border-surface-600 text-left">
              <th className="pb-3 pr-4">Ime</th>
              <th className="pb-3 pr-4">E-pošta</th>
              <th className="pb-3 pr-4">Vloga</th>
              <th className="pb-3 pr-4">Vožnje</th>
              <th className="pb-3">Vozila</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-700/40 transition-colors">
                <td className="py-3 pr-4 text-white font-medium">{u.name}</td>
                <td className="py-3 pr-4 text-surface-300">{u.email}</td>
                <td className="py-3 pr-4">
                  <Badge variant={u.role === 'ADMIN' ? 'blue' : 'gray'}>{u.role}</Badge>
                </td>
                <td className="py-3 pr-4 text-surface-300">{u._count.trips}</td>
                <td className="py-3 text-surface-300">{u._count.vehicles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
