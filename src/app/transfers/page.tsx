import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import TransfersClient from '@/components/TransfersClient';

export const dynamic = 'force-dynamic';

export default async function TransfersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [players, squad, clubs] = await Promise.all([
    prisma.player.findMany({ include: { club: true }, orderBy: { price: 'desc' } }),
    prisma.squad.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { teamName: true } },
        players: { include: { player: { include: { club: true } } } },
      },
    }),
    prisma.club.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return <TransfersClient initialPlayers={players} initialClubs={clubs} initialSquad={squad} />;
}
