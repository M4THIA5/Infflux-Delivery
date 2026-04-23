import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
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
    const existing = await repo.findOneBy({ email: user.email });
    if (!existing) {
      const hashed = await bcrypt.hash(user.password, 10);
      await repo.save(repo.create({ ...user, password: hashed }));
    }
  }

  console.log(`  ✅ ${users.length} utilisateurs seedés`);
}
