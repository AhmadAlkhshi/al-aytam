import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Session } from '../sessions/session.entity';
import { Student } from '../students/student.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Session, session => session.activities, { eager: true })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => Student, student => student.activities, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'varchar', length: 50 })
  activityType: string;

  @Column({ type: 'integer' })
  count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
