import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';

const mockUser: User = {
  id: 'uuid-1',
  role: UserRole.ADMIN,
  name: 'Admin',
  email: 'admin@test.com',
  password: 'hashed',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  customerCourses: [],
  deliveredCourses: [],
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
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      await expect(
        service.create({ role: UserRole.ADMIN, name: 'Admin', email: 'admin@test.com', password: '123456' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return a user', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      const result = await service.create({
        role: UserRole.ADMIN,
        name: 'Admin',
        email: 'admin@test.com',
        password: '123456',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users when no role filter', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);
      const result = await service.findAll();
      expect(mockRepository.find).toHaveBeenCalledWith({});
      expect(result).toEqual([mockUser]);
    });

    it('should filter by role when provided', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);
      await service.findAll(UserRole.ADMIN);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { role: UserRole.ADMIN } });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should return user if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should delete user if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      await service.remove('uuid-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('uuid-1');
    });
  });
});
