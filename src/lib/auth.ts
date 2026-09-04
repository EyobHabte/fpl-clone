import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import { prisma } from './prisma';

/** Returns the signed-in user, or null if there's no active session. */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const userId = (session.user as { id?: string }).id;
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}
