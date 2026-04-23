import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident, IncidentType } from './incident.entity';

const mockIncident: Incident = {
  id: 'uuid-1',
  type: IncidentType.ROUTIER,
  commentaire: 'Embouteillage sur le périphérique',
  createdAt: new Date(),
  courseId: 'course-uuid-1',
  userId: 'user-uuid-1',
  course: null as any,
  user: null as any,
};

const mockRepository = {
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('IncidentsService', () => {
  let service: IncidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: getRepositoryToken(Incident), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return an incident', async () => {
      mockRepository.create.mockReturnValue(mockIncident);
      mockRepository.save.mockResolvedValue(mockIncident);

      const dto = {
        type: IncidentType.ROUTIER,
        commentaire: 'Embouteillage sur le périphérique',
        courseId: 'course-uuid-1',
        userId: 'user-uuid-1',
      };
      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockIncident);
      expect(result).toEqual(mockIncident);
    });
  });

  describe('findAll', () => {
    it('should return all incidents', async () => {
      mockRepository.find.mockResolvedValue([mockIncident]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockIncident]);
    });
  });

  describe('findOne', () => {
    it('should return the incident if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockIncident);

      const result = await service.findOne('uuid-1');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(result).toEqual(mockIncident);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCourse', () => {
    it('should return incidents for a given course', async () => {
      mockRepository.findBy.mockResolvedValue([mockIncident]);

      const result = await service.findByCourse('course-uuid-1');

      expect(mockRepository.findBy).toHaveBeenCalledWith({ courseId: 'course-uuid-1' });
      expect(result).toEqual([mockIncident]);
    });

    it('should return empty array if no incidents for course', async () => {
      mockRepository.findBy.mockResolvedValue([]);

      const result = await service.findByCourse('course-uuid-unknown');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update and return the incident', async () => {
      const updated = { ...mockIncident, commentaire: 'Mise à jour' };
      mockRepository.findOneBy.mockResolvedValue({ ...mockIncident });
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { commentaire: 'Mise à jour' });

      expect(result.commentaire).toBe('Mise à jour');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if incident not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update('bad-id', { commentaire: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the incident if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockIncident);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('uuid-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('uuid-1');
    });

    it('should throw NotFoundException if incident not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
