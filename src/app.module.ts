import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/user.entity';
import { Entrepot } from './entrepots/entrepot.entity';
import { Course } from './courses/course.entity';
import { Incident } from './incidents/incident.entity';
import { UsersModule } from './users/users.module';
import { EntrepotsModule } from './entrepots/entrepots.module';
import { CoursesModule } from './courses/courses.module';
import { IncidentsModule } from './incidents/incidents.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Entrepot, Course, Incident],
      synchronize: true,
    }),
    UsersModule,
    EntrepotsModule,
    CoursesModule,
    IncidentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
