import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Session } from '../sessions/session.entity';
import { Student } from '../students/student.entity';

@Entity('attendances')
@Index('idx_attendances_unique', ['session', 'student'], { unique: true })
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Session, session => session.attendances, { eager: true })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => Student, student => student.attendances, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'varchar', length: 50, default: 'present' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
