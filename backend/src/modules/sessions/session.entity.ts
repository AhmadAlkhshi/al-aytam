import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Activity } from '../activities/activity.entity';
import { Point } from '../points/point.entity';
import { Attendance } from '../attendances/attendance.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', unique: true, name: 'session_number' })
  @Index('idx_session_number')
  sessionNumber: number;

  @Column({ type: 'date', name: 'session_date' })
  @Index('idx_session_date')
  sessionDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Activity, activity => activity.session)
  activities: Activity[];

  @OneToMany(() => Point, point => point.session)
  points: Point[];

  @OneToMany(() => Attendance, attendance => attendance.session)
  attendances: Attendance[];
}
