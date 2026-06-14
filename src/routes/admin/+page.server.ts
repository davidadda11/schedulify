import type { PageServerLoad } from './$types';
import { db } from '$db/index';
import { user as users } from '$db/schema';
import { eq, count } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
  const [totalUsers] = await db.select({ count: count() }).from(users);
  const [bannedUsers] = await db.select({ count: count() }).from(users).where(eq(users.banned, true));
  const [adminCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin'));

  return {
    totalUsers: totalUsers.count,
    bannedUsers: bannedUsers.count,
    adminCount: adminCount.count,
  };
};
