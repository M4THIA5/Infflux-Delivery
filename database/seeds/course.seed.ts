import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Course } from '../../src/courses/course.entity';
import { User } from '../../src/users/user.entity';
import { Entrepot } from '../../src/entrepots/entrepot.entity';

interface CourseSeedData {
  customerEmail: string;
  delivererEmail: string | null;
  entrepotAddresse: string;
  dateHeureDebut: string;
  dateHeureArrivee: string | null;
  prix: number;
  adresseLivraison: string;
}

export async function seedCourses(dataSource: DataSource): Promise<Course[]> {
  const data: CourseSeedData[] = JSON.parse(
    readFileSync(join(__dirname, '../data/course.json'), 'utf-8'),
  ) as CourseSeedData[];

  const courseRepo = dataSource.getRepository(Course);
  const userRepo = dataSource.getRepository(User);
  const entrepotRepo = dataSource.getRepository(Entrepot);

  const seeded: Course[] = [];

  for (const item of data) {
    const customer = await userRepo.findOneByOrFail({ email: item.customerEmail });
    const entrepot = await entrepotRepo.findOneByOrFail({ addresse: item.entrepotAddresse });

    let delivererId: string | null = null;
    if (item.delivererEmail) {
      const deliverer = await userRepo.findOneByOrFail({ email: item.delivererEmail });
      delivererId = deliverer.id;
    }

    const existing = await courseRepo.findOneBy({
      customerId: customer.id,
      adresseLivraison: item.adresseLivraison,
    });

    if (!existing) {
      const course = courseRepo.create({
        customerId: customer.id,
        delivererId,
        entrepotId: entrepot.id,
        dateHeureDebut: new Date(item.dateHeureDebut),
        dateHeureArrivee: item.dateHeureArrivee ? new Date(item.dateHeureArrivee) : null,
        prix: item.prix,
        adresseLivraison: item.adresseLivraison,
      });
      seeded.push(await courseRepo.save(course));
    } else {
      seeded.push(existing);
    }
  }

  console.log(`  ✅ ${data.length} courses seedées`);
  return seeded;
}
