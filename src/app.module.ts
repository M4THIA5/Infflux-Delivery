import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule, InjectDataSource } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/user.entity';
import { UserRole } from './users/user.entity';
import { Entrepot } from './entrepots/entrepot.entity';
import { Course } from './courses/course.entity';
import { Incident } from './incidents/incident.entity';
import { UsersModule } from './users/users.module';
import { EntrepotsModule } from './entrepots/entrepots.module';
import { CoursesModule } from './courses/courses.module';
import { IncidentsModule } from './incidents/incidents.module';
import { AuthModule } from './auth/auth.module';

const DEFAULT_USERS = [
  { role: UserRole.ADMIN, name: 'Admin', email: 'admin@infflux.dev', password: 'admin123' },
  { role: UserRole.DELIVER, name: 'Livreur', email: 'livreur@infflux.dev', password: 'livreur123' },
  { role: UserRole.CUSTOMER, name: 'Client', email: 'client@infflux.dev', password: 'client123' },
];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Entrepot, Course, Incident],
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    EntrepotsModule,
    CoursesModule,
    IncidentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS postgis');
    await this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    for (const u of DEFAULT_USERS) {
      const exists = await this.dataSource.query(
        `SELECT id FROM "user" WHERE email = $1`,
        [u.email],
      );
      if (exists.length === 0) {
        const hashed = await bcrypt.hash(u.password, 10);
        await this.dataSource.query(
          `INSERT INTO "user" (id, role, name, email, password, "isActive", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, true, now(), now())`,
          [u.role, u.name, u.email, hashed],
        );
      }
    }
  }
}
