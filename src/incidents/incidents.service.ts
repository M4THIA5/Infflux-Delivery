import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './incident.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentsRepository: Repository<Incident>,
  ) {}

  findAll(): Promise<Incident[]> {
    return this.incidentsRepository.find();
  }

  findOne(id: string): Promise<Incident | null> {
    return this.incidentsRepository.findOneBy({ id });
  }
}
