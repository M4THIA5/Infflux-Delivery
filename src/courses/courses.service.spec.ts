import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course } from './course.entity';

const mockCourse = {
  id: 'course-1',
  dateHeureDebut: new Date(),
  dateHeureArrivee: null,
  prix: 15.5,
  adresseLivraison: '1 rue de Paris',
  customerId: 'customer-1',
  delivererId: null,
  entrepotId: 'entrepot-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: null,
  deliverer: null,
  entrepot: null,
  incidents: [],
};

const mockRepository = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
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

  describe('create', () => {
    it('should create and return a course', async () => {
      mockRepository.create.mockReturnValue(mockCourse);
      mockRepository.save.mockResolvedValue(mockCourse);
      const result = await service.create({
        dateHeureDebut: new Date().toISOString(),
        prix: 15.5,
        adresseLivraison: '1 rue de Paris',
        customerId: 'customer-1',
        entrepotId: 'entrepot-1',
      });
      expect(result).toEqual(mockCourse);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should return course with relations', async () => {
      mockRepository.findOne.mockResolvedValue(mockCourse);
      const result = await service.findOne('course-1');
      expect(result).toEqual(mockCourse);
    });
  });

  describe('accept', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.accept('bad-id', 'deliverer-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already accepted', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockCourse, delivererId: 'existing-deliverer' });
      await expect(service.accept('course-1', 'deliverer-1')).rejects.toThrow(ConflictException);
    });

    it('should set delivererId and save', async () => {
      const course = { ...mockCourse, delivererId: null };
      mockRepository.findOne.mockResolvedValue(course);
      mockRepository.save.mockResolvedValue({ ...course, delivererId: 'deliverer-1' });
      const result = await service.accept('course-1', 'deliverer-1');
      expect(result.delivererId).toBe('deliverer-1');
    });
  });

  describe('findPending', () => {
    it('should return courses without deliverer', async () => {
      mockRepository.find.mockResolvedValue([mockCourse]);
      const result = await service.findPending();
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { delivererId: expect.anything() } });
      expect(result).toEqual([mockCourse]);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should delete course', async () => {
      mockRepository.findOne.mockResolvedValue(mockCourse);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      await service.remove('course-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('course-1');
    });
  });
});
