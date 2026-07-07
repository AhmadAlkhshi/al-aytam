import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Session } from '../sessions/session.entity';
import { Student } from '../students/student.entity';

@Entity('points')
export class Point {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Session, session => session.points, { eager: true })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => Student, student => student.points, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'varchar', length: 255 })
  reason: string;

  @Column({ type: 'integer' })
  points: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  action: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
