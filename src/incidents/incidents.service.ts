import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentsRepository: Repository<Incident>,
  ) {}

  create(dto: CreateIncidentDto): Promise<Incident> {
    const incident = this.incidentsRepository.create(dto);
    return this.incidentsRepository.save(incident);
  }

  findAll(): Promise<Incident[]> {
    return this.incidentsRepository.find();
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentsRepository.findOneBy({ id });
    if (!incident) throw new NotFoundException(`Incident ${id} introuvable`);
    return incident;
  }

  findByCourse(courseId: string): Promise<Incident[]> {
    return this.incidentsRepository.findBy({ courseId });
  }

  async update(id: string, dto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.findOne(id);
    Object.assign(incident, dto);
    return this.incidentsRepository.save(incident);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.incidentsRepository.delete(id);
  }
}
