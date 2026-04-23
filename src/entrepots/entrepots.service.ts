import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrepot } from './entrepot.entity';
import { CreateEntrepotDto } from './dto/create-entrepot.dto';
import { UpdateEntrepotDto } from './dto/update-entrepot.dto';

@Injectable()
export class EntrepotsService {
  constructor(
    @InjectRepository(Entrepot)
    private readonly entrepotsRepository: Repository<Entrepot>,
  ) {}

  create(dto: CreateEntrepotDto): Promise<Entrepot> {
    const entrepot = this.entrepotsRepository.create(dto);
    return this.entrepotsRepository.save(entrepot);
  }

  findAll(): Promise<Entrepot[]> {
    return this.entrepotsRepository.find();
  }

  async findOne(id: string): Promise<Entrepot> {
    const entrepot = await this.entrepotsRepository.findOneBy({ id });
    if (!entrepot) throw new NotFoundException(`Entrepot ${id} introuvable`);
    return entrepot;
  }

  async update(id: string, dto: UpdateEntrepotDto): Promise<Entrepot> {
    const entrepot = await this.findOne(id);
    Object.assign(entrepot, dto);
    return this.entrepotsRepository.save(entrepot);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.entrepotsRepository.delete(id);
  }
}
