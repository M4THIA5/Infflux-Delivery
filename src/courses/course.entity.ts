import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Entrepot } from '../entrepots/entrepot.entity';
import type { Incident } from '../incidents/incident.entity';

@Entity()
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  dateHeureDebut: Date;

  @Column({ nullable: true, type: 'timestamp' })
  dateHeureArrivee: Date | null;

  @Column('decimal', { precision: 10, scale: 2 })
  prix: number;

  @Column({ type: 'varchar' })
  adresseLivraison: string;

  @Column({ type: 'float', nullable: true })
  latLivraison: number | null;

  @Column({ type: 'float', nullable: true })
  lngLivraison: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid', nullable: true })
  delivererId: string | null;

  @Column({ type: 'uuid' })
  entrepotId: string;

  @Column('enum', {
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

  @Column({ type: 'boolean', default: true })
  isLegal: boolean;

  @Column({ type: 'enum', enum: ['SMALL', 'MEDIUM', 'LARGE', 'REFRIGERATED'] })
  remorque: 'SMALL' | 'MEDIUM' | 'LARGE' | 'REFRIGERATED';

  @ManyToOne(() => User, (user) => user.customerCourses)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => User, (user) => user.deliveredCourses, { nullable: true })
  @JoinColumn({ name: 'delivererId' })
  deliverer: User | null;

  @ManyToOne(() => Entrepot, (entrepot) => entrepot.courses)
  @JoinColumn({ name: 'entrepotId' })
  entrepot: Entrepot;

  @OneToMany('Incident', 'course')
  incidents: Incident[];
}
