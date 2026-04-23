import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Entrepot } from '../../src/entrepots/entrepot.entity';

interface EntrepotSeedData {
  addresse: string;
}

export async function seedEntrepots(dataSource: DataSource): Promise<void> {
  const entrepots: EntrepotSeedData[] = JSON.parse(
    readFileSync(join(__dirname, '../data/entrepot.json'), 'utf-8'),
  ) as EntrepotSeedData[];

  const repo = dataSource.getRepository(Entrepot);

  for (const entrepot of entrepots) {
    const existing = await repo.findOneBy({ addresse: entrepot.addresse });
    if (!existing) {
      await repo.save(repo.create(entrepot));
    }
  }

  console.log(`  ✅ ${entrepots.length} entrepots seedés`);
}
