import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { User, UserRole } from '../../src/users/user.entity';

interface UserSeedData {
  role: UserRole;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
}

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const users: UserSeedData[] = JSON.parse(
    readFileSync(join(__dirname, '../data/user.json'), 'utf-8'),
  ) as UserSeedData[];

  const repo = dataSource.getRepository(User);

  for (const user of users) {
    await repo.upsert(user, ['email']);
  }

  console.log(`  ✅ ${users.length} utilisateurs seedés`);
}
