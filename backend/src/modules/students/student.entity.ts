import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Activity } from '../activities/activity.entity';
import { Point } from '../points/point.entity';
import { Attendance } from '../attendances/attendance.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 100, name: 'guardian_name' })
  guardianName: string;

  @Column({ type: 'integer' })
  age: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Activity, activity => activity.student)
  activities: Activity[];

  @OneToMany(() => Point, point => point.student)
  points: Point[];

  @OneToMany(() => Attendance, attendance => attendance.student)
  attendances: Attendance[];
}
