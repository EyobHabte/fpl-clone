import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import SettingsClient from '@/components/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <SettingsClient
      email={user.email}
      teamName={user.teamName}
      phone={user.phone}
      phoneVerified={!!user.phoneVerified}
    />
  );
}
