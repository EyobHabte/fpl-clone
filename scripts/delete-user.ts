/**
 * Deletes a user account and everything tied to it: squad, squad players,
 * gameweek history, league entries, and verification tokens.
 *
 * Usage: npx tsx scripts/delete-user.ts someone@example.com
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx scripts/delete-user.ts <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { squad: true },
  });

  if (!user) {
    console.log(`No user found with email "${email}".`);
    return;
  }

  const gameweekSquads = await prisma.gameweekSquad.findMany({ where: { userId: user.id } });

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
    prisma.leagueEntry.deleteMany({ where: { userId: user.id } }),
    prisma.gameweekSquadPlayer.deleteMany({
      where: { gameweekSquadId: { in: gameweekSquads.map((g) => g.id) } },
    }),
    prisma.gameweekSquad.deleteMany({ where: { userId: user.id } }),
    ...(user.squad
      ? [
          prisma.squadPlayer.deleteMany({ where: { squadId: user.squad.id } }),
          prisma.squad.delete({ where: { id: user.squad.id } }),
        ]
      : []),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  console.log(`Deleted "${email}" and all related data.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
