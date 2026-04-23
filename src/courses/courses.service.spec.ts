import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { Course } from './course.entity';

const mockCourse: Course = {
  id: 'uuid-1',
  dateHeureDebut: new Date('2026-04-20T09:00:00Z'),
  dateHeureArrivee: new Date('2026-04-20T11:30:00Z'),
  prix: 45.5,
  adresseLivraison: '5 Avenue des Champs-Élysées, 75008 Paris',
  createdAt: new Date(),
  updatedAt: new Date(),
  customerId: 'customer-uuid-1',
  delivererId: 'deliverer-uuid-1',
  entrepotId: 'entrepot-uuid-1',
  customer: null as any,
  deliverer: null as any,
  entrepot: null as any,
  incidents: [],
};

const mockRepository = {
  findOneBy: jest.fn(),
  find: jest.fn(),
};

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all courses', async () => {
      mockRepository.find.mockResolvedValue([mockCourse]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockCourse]);
    });

    it('should return an empty array when no courses exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return the course if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockCourse);

      const result = await service.findOne('uuid-1');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(result).toEqual(mockCourse);
    });

    it('should return null if course not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne('bad-id');

      expect(result).toBeNull();
    });
  });
});
