import type { PageServerLoad, Actions } from './$types';
import { db } from '$db/index';
import { users, sessions } from '$db/schema';
import { eq, desc, gt } from 'drizzle-orm';  // ← gt adăugat
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  const allUsers = await db
    .select({
      id:            users.id,
      name:          users.name,
      email:         users.email,
      role:          users.role,
      banned:        users.banned,
      emailVerified: users.emailVerified,
      gradeLevel:    users.gradeLevel,
      school:        users.school,
      createdAt:     users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const activeSessions = await db
    .select({
      userId:    sessions.userId,
      ipAddress: sessions.ipAddress,
      userAgent: sessions.userAgent,
      expiresAt: sessions.expiresAt,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(gt(sessions.expiresAt, new Date()));

  const sessionsByUser = activeSessions.reduce((acc, s) => {
    if (!acc[s.userId]) acc[s.userId] = [];
    acc[s.userId].push(s);
    return acc;
  }, {} as Record<string, typeof activeSessions>);

  return { allUsers, sessionsByUser };
};

export const actions: Actions = {
  toggleBan: async ({ request }: { request: Request }) => {
    const data = await request.formData();
    const userId = data.get('userId') as string;
    const banned = data.get('banned') === 'true';

    if (!userId) return fail(400, { error: 'userId lipsă' });

    await db.update(users).set({ banned: !banned }).where(eq(users.id, userId));
    return { success: true };
  },

  toggleRole: async ({ request }: { request: Request }) => {
    const data = await request.formData();
    const userId = data.get('userId') as string;
    const role   = data.get('role') as string;

    if (!userId) return fail(400, { error: 'userId lipsă' });

    const newRole = role === 'admin' ? 'user' : 'admin';
    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
    return { success: true };
  },

  deleteUser: async ({ request }: { request: Request }) => {
    const data = await request.formData();
    const userId = data.get('userId') as string;

    if (!userId) return fail(400, { error: 'userId lipsă' });

    await db.delete(users).where(eq(users.id, userId));
    return { success: true };
  },
};