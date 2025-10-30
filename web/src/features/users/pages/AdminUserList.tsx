import { useQuery } from '@tanstack/react-query';
import { Table } from 'flowbite-react';
import api from '../../../lib/api-client';

interface UserSummary {
  id: number;
  email: string;
  role: string;
  fullName?: string | null;
  createdAt?: string;
}

export function AdminUserList() {
  const { data, isLoading } = useQuery<UserSummary[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get<UserSummary[]>('/users');
      return response.data;
    },
  });

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500">Manage store admins and customers.</p>
      </div>
      <div className="overflow-x-auto">
        <Table striped hoverable>
          <Table.Head>
            <Table.HeadCell>Email</Table.HeadCell>
            <Table.HeadCell>Role</Table.HeadCell>
            <Table.HeadCell>Name</Table.HeadCell>
            <Table.HeadCell>Joined</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={4}>Loading users…</Table.Cell>
              </Table.Row>
            ) : data?.length ? (
              data.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>{user.email}</Table.Cell>
                  <Table.Cell className="capitalize">{user.role}</Table.Cell>
                  <Table.Cell>{user.fullName ?? '—'}</Table.Cell>
                  <Table.Cell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={4}>No users found.</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>
    </section>
  );
}
