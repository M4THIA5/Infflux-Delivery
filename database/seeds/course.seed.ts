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
  latLivraison?: number;
  lngLivraison?: number;
  remorque: 'SMALL' | 'MEDIUM' | 'LARGE' | 'REFRIGERATED';
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  isLegal?: boolean;
  note?: number | null;
}

export async function seedCourses(dataSource: DataSource): Promise<Course[]> {
  const data: CourseSeedData[] = JSON.parse(
    readFileSync(join(__dirname, '../data/course.json'), 'utf-8'),
  ) as CourseSeedData[];

  const courseRepo = dataSource.getRepository(Course);
  const userRepo = dataSource.getRepository(User);
  const entrepotRepo = dataSource.getRepository(Entrepot);

  const result: Course[] = [];
  let inserted = 0;

  for (const item of data) {
    const customer = await userRepo.findOneBy({ email: item.customerEmail });
    if (!customer) {
      console.warn(
        `  ⚠️  customer introuvable : ${item.customerEmail}, course ignorée`,
      );
      continue;
    }

    const entrepot = await entrepotRepo.findOneBy({
      addresse: item.entrepotAddresse,
    });
    if (!entrepot) {
      console.warn(
        `  ⚠️  entrepot introuvable : ${item.entrepotAddresse}, course ignorée`,
      );
      continue;
    }

    let delivererId: string | null = null;
    if (item.delivererEmail) {
      const deliverer = await userRepo.findOneBy({
        email: item.delivererEmail,
      });
      if (!deliverer) {
        console.warn(
          `  ⚠️  livreur introuvable : ${item.delivererEmail}, course ignorée`,
        );
        continue;
      }
      delivererId = deliverer.id;
    }

    const existing = await courseRepo.findOneBy({
      customerId: customer.id,
      adresseLivraison: item.adresseLivraison,
    });

    if (existing) {
      result.push(existing);
      continue;
    }

    const course = await courseRepo.save(
      courseRepo.create({
        customerId: customer.id,
        delivererId,
        entrepotId: entrepot.id,
        dateHeureDebut: new Date(item.dateHeureDebut),
        dateHeureArrivee: item.dateHeureArrivee
          ? new Date(item.dateHeureArrivee)
          : null,
        prix: item.prix,
        adresseLivraison: item.adresseLivraison,
        latLivraison: item.latLivraison ?? null,
        lngLivraison: item.lngLivraison ?? null,
        remorque: item.remorque,
        status: item.status ?? 'PENDING',
        isLegal: item.isLegal ?? true,
        note: item.note ?? null,
      }),
    );

    result.push(course);
    inserted++;
  }

  console.log(
    `  ✅ courses : ${inserted} insérées, ${data.length - inserted} ignorées (déjà existantes)`,
  );
  return result;
}
