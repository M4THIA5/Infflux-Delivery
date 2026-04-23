import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrepot } from './entrepot.entity';

@Injectable()
export class EntrepotsService {
  constructor(
    @InjectRepository(Entrepot)
    private readonly entrepotsRepository: Repository<Entrepot>,
  ) {}

  findAll(): Promise<Entrepot[]> {
    return this.entrepotsRepository.find();
  }

  findOne(id: string): Promise<Entrepot | null> {
    return this.entrepotsRepository.findOneBy({ id });
  }
}
