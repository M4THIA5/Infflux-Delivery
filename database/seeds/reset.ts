import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../../src/users/user.entity';
import { Entrepot } from '../../src/entrepots/entrepot.entity';
import { Course } from '../../src/courses/course.entity';
import { Incident } from '../../src/incidents/incident.entity';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Entrepot, Course, Incident],
  synchronize: false,
});

async function main(): Promise<void> {
  console.log('🗑️  Reset de la base de données...');
  await dataSource.initialize();

  // Ordre inverse des dépendances
  await dataSource.getRepository(Incident).delete({});
  console.log('  ✅ incidents supprimés');

  await dataSource.getRepository(Course).delete({});
  console.log('  ✅ courses supprimées');

  await dataSource.getRepository(Entrepot).delete({});
  console.log('  ✅ entrepots supprimés');

  await dataSource.getRepository(User).delete({});
  console.log('  ✅ utilisateurs supprimés');

  console.log('✅ Reset terminé');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => dataSource.destroy());
