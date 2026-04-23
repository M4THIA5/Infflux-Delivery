import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Course } from '../courses/course.entity';

@Entity()
export class Entrepot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  addresse: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Course', 'entrepot')
  courses: Course[];
}
