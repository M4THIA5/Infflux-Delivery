import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';
import { AuthController } from '../src/auth/auth.controller';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { UsersService } from '../src/users/users.service';
import { User, UserRole } from '../src/users/user.entity';

const JWT_SECRET = 'test-secret';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let token: string;

  const mockUser = {
    id: 'uuid-admin',
    role: UserRole.ADMIN,
    name: 'Admin',
    email: 'admin@test.com',
    password: bcrypt.hashSync('password123', 10),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    customerCourses: [],
    deliveredCourses: [],
    incidents: [],
  } as User;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findOne: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('devrait retourner 400 si le body est invalide (email malformé)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'pas-un-email', password: 'password123' })
        .expect(400);
    });

    it('devrait retourner 400 si le mot de passe est trop court', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: '123' })
        .expect(400);
    });

    it('devrait retourner 400 si le body est vide', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });

    it("devrait retourner 401 si l'utilisateur n'existe pas", () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'inconnu@test.com', password: 'password123' })
        .expect(401);
    });

    it('devrait retourner 401 si le mot de passe est incorrect', () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'mauvais_mdp' })
        .expect(401);
    });

    it('devrait retourner 401 si le compte est inactif', () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' })
        .expect(401);
    });

    it("devrait retourner 200 avec un access_token et l'utilisateur (sans mot de passe)", async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' })
        .expect(200);

      expect(res.body.access_token).toBeDefined();
      expect(typeof res.body.access_token).toBe('string');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(mockUser.email);
      expect(res.body.user.role).toBe(UserRole.ADMIN);
      expect(res.body.user.password).toBeUndefined();

      token = res.body.access_token as string;
    });
  });

  describe('GET /auth/me', () => {
    it('devrait retourner 401 sans token', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('devrait retourner 401 avec un token invalide', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer token_invalide')
        .expect(401);
    });

    it("devrait retourner 200 avec l'utilisateur courant (sans mot de passe)", async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });

      token = loginRes.body.access_token as string;

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(mockUser.id);
      expect(res.body.email).toBe(mockUser.email);
      expect(res.body.password).toBeUndefined();
    });

    it("devrait retourner 401 si l'utilisateur est inactif", async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });

      token = loginRes.body.access_token as string;

      mockUsersService.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
