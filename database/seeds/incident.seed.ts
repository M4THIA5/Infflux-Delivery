import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Incident, IncidentType } from '../../src/incidents/incident.entity';
import { User } from '../../src/users/user.entity';
import { Course } from '../../src/courses/course.entity';

interface IncidentSeedData {
  courseIndex: number;
  userEmail: string;
  type: IncidentType;
  commentaire: string;
}

export async function seedIncidents(
  dataSource: DataSource,
  courses: Course[],
): Promise<void> {
  const data: IncidentSeedData[] = JSON.parse(
    readFileSync(join(__dirname, '../data/incident.json'), 'utf-8'),
  ) as IncidentSeedData[];

  const incidentRepo = dataSource.getRepository(Incident);
  const userRepo = dataSource.getRepository(User);

  for (const item of data) {
    const course = courses[item.courseIndex];
    if (!course) {
      console.warn(`  ⚠️  courseIndex ${item.courseIndex} introuvable, incident ignoré`);
      continue;
    }

    const user = await userRepo.findOneByOrFail({ email: item.userEmail });

    const existing = await incidentRepo.findOneBy({
      courseId: course.id,
      userId: user.id,
      type: item.type,
    });

    if (!existing) {
      await incidentRepo.save(
        incidentRepo.create({
          type: item.type,
          commentaire: item.commentaire,
          courseId: course.id,
          userId: user.id,
        }),
      );
    }
  }

  console.log(`  ✅ ${data.length} incidents seedés`);
}
