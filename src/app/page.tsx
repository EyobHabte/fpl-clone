import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import PickTeamClient from '@/components/PickTeamClient';


export const dynamic = 'force-dynamic';

export default async function PickTeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const squad = await prisma.squad.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { teamName: true } },
      players: { include: { player: { include: { club: true } } } },
    },
  });

  return <PickTeamClient initialSquad={squad} />;
}
