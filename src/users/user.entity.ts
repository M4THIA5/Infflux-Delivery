import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import type { Course } from '../courses/course.entity';
import type { Incident } from '../incidents/incident.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  DELIVER = 'DELIVER',
  CUSTOMER = 'CUSTOMER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  position: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Course', 'customer')
  customerCourses: Course[];

  @OneToMany('Course', 'deliverer')
  deliveredCourses: Course[];

  @OneToMany('Incident', 'user')
  incidents: Incident[];
}
