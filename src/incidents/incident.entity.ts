import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from '../courses/course.entity';
import { User } from '../users/user.entity';

export enum IncidentType {
  ROUTIER = 'ROUTIER',
  CASSE = 'CASSE',
  PERTE = 'PERTE',
  PAUSE_CAFE = 'PAUSE_CAFE',
  DOUANE = 'DOUANE',
}

@Entity()
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: IncidentType })
  type: IncidentType;

  @Column()
  commentaire: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  courseId: string;

  @Column()
  userId: string;

  @ManyToOne(() => Course, (course) => course.incidents)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => User, (user) => user.incidents)
  @JoinColumn({ name: 'userId' })
  user: User;
}
