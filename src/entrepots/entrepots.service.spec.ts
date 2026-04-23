import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EntrepotsService } from './entrepots.service';
import { Entrepot } from './entrepot.entity';

const mockEntrepot: Entrepot = {
  id: 'uuid-1',
  addresse: '10 Rue de la Logistique, 75001 Paris',
  latitude: null,
  longitude: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  courses: [],
};

const mockRepository = {
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('EntrepotsService', () => {
  let service: EntrepotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntrepotsService,
        { provide: getRepositoryToken(Entrepot), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<EntrepotsService>(EntrepotsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return an entrepot', async () => {
      mockRepository.create.mockReturnValue(mockEntrepot);
      mockRepository.save.mockResolvedValue(mockEntrepot);

      const result = await service.create({ addresse: '10 Rue de la Logistique, 75001 Paris' });

      expect(mockRepository.create).toHaveBeenCalledWith({ addresse: '10 Rue de la Logistique, 75001 Paris' });
      expect(mockRepository.save).toHaveBeenCalledWith(mockEntrepot);
      expect(result).toEqual(mockEntrepot);
    });
  });

  describe('findAll', () => {
    it('should return all entrepots', async () => {
      mockRepository.find.mockResolvedValue([mockEntrepot]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockEntrepot]);
    });
  });

  describe('findOne', () => {
    it('should return the entrepot if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockEntrepot);

      const result = await service.findOne('uuid-1');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(result).toEqual(mockEntrepot);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the entrepot', async () => {
      const updated = { ...mockEntrepot, addresse: 'Nouvelle adresse' };
      mockRepository.findOneBy.mockResolvedValue({ ...mockEntrepot });
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { addresse: 'Nouvelle adresse' });

      expect(result.addresse).toBe('Nouvelle adresse');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if entrepot not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update('bad-id', { addresse: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the entrepot if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockEntrepot);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('uuid-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('uuid-1');
    });

    it('should throw NotFoundException if entrepot not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
