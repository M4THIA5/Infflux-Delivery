import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../../src/users/user.entity';
import { Entrepot } from '../../src/entrepots/entrepot.entity';
import { Course } from '../../src/courses/course.entity';
import { Incident } from '../../src/incidents/incident.entity';
import { seedUsers } from './user.seed';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Entrepot, Course, Incident],
  synchronize: false,
});

async function main(): Promise<void> {
  console.log('🌱 Seeding...');
  await dataSource.initialize();

  await seedUsers(dataSource);

  console.log('✅ Seed terminé');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => dataSource.destroy());
