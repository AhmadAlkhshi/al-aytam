import AppDataSource from '../../config/database';
import { Attendance } from '../attendances/attendance.entity';
import { Session } from '../sessions/session.entity';
import { AppError } from '../../shared/middleware/error.middleware';

// ─── Division Rules ────────────────────────────────────────────────────────────

/**
 * Category division rules for 15–36 students.
 * Each entry maps a total student count to [categoryA size, categoryB size].
 */
export const CATEGORY_DIVISION_RULES: Record<number, [number, number]> = {
  15: [9, 6],   16: [8, 8],   17: [9, 8],   18: [9, 9],
  19: [10, 9],  20: [10, 10], 21: [12, 9],  22: [12, 10],
  23: [14, 9],  24: [12, 12], 25: [15, 10], 26: [14, 12],
  27: [15, 12], 28: [16, 12], 29: [15, 14], 30: [15, 15],
  31: [16, 15], 32: [16, 16], 33: [18, 15], 34: [18, 16],
  35: [18, 17], 36: [18, 18]
};

/**
 * Group division rules for 5–18 students per category.
 * Each entry maps a category size to an array of group sizes.
 */
export const GROUP_DIVISION_RULES: Record<number, number[]> = {
  5:  [5],
  6:  [3, 3],
  7:  [7],
  8:  [4, 4],
  9:  [3, 3, 3],
  10: [5, 5],
  11: [11],
  12: [4, 4, 4],
  13: [13],
  14: [7, 7],
  15: [5, 5, 5],
  16: [4, 4, 4, 4],
  17: [17],
  18: [6, 6, 6]
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StudentInfo {
  id: number;
  firstName: string;
  lastName: string;
  guardianName: string;
  age: number;
}

export interface Group {
  groupNumber: number;
  students: StudentInfo[];
  count: number;
}

export interface Category {
  name: string; // 'أ' أو 'ب'
  students: StudentInfo[];
  groups: Group[];
  count: number;
}

export interface DivisionResult {
  sessionId: number;
  totalStudents: number;
  categories: Category[];
  message?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fisher-Yates in-place shuffle.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Split a student list into groups according to the given group-size array.
 * If the count falls outside GROUP_DIVISION_RULES, the entire list becomes a
 * single group.
 */
export function buildGroups(students: StudentInfo[]): Group[] {
  const count = students.length;

  // Special case: fewer than 5 → single group
  if (count < 5) {
    return [{ groupNumber: 1, students, count }];
  }

  const groupSizes = GROUP_DIVISION_RULES[count];

  // No rule found (e.g. count > 18) → single group with warning handled upstream
  if (!groupSizes) {
    return [{ groupNumber: 1, students, count }];
  }

  const groups: Group[] = [];
  let offset = 0;

  groupSizes.forEach((size, index) => {
    const slice = students.slice(offset, offset + size);
    groups.push({ groupNumber: index + 1, students: slice, count: slice.length });
    offset += size;
  });

  return groups;
}

// ─── Service ───────────────────────────────────────────────────────────────────

/**
 * Pure function: apply category division rules to a flat student list.
 * Returns the DivisionResult structure without any DB access.
 */
export function applyCategoryDivision(students: StudentInfo[]): {
  categories: Array<{ name: string; students: StudentInfo[]; groups: Group[]; count: number }>;
  message?: string;
} {
  const total = students.length;

  if (total === 0) {
    return { categories: [] };
  }

  let message: string | undefined;
  let categoryStudents: [StudentInfo[], StudentInfo[]];

  if (total < 15) {
    categoryStudents = [students, []];
  } else if (total <= 36) {
    const rule = CATEGORY_DIVISION_RULES[total] as [number, number];
    const sizeA = rule[0];
    categoryStudents = [
      students.slice(0, sizeA),
      students.slice(sizeA)
    ];
  } else {
    message = `عدد الطلاب (${total}) يتجاوز الحد الأقصى المدعوم (36). تم وضع جميع الطلاب في فئة واحدة.`;
    categoryStudents = [students, []];
  }

  const categoryNames = ['أ', 'ب'];
  const categories = categoryStudents
    .map((sts, index) => ({
      name: categoryNames[index] ?? '',
      students: sts,
      groups: buildGroups(sts),
      count: sts.length
    }))
    .filter(cat => cat.count > 0);

  return { categories, ...(message ? { message } : {}) };
}

export class DivisionService {
  private get attendanceRepository() {
    return AppDataSource.getRepository(Attendance);
  }

  /**
   * Calculate the division for a given session.
   *
   * Steps:
   *  1. Verify the session exists.
   *  2. Fetch all 'present' attendance records.
   *  3. Shuffle the student list randomly (Fisher-Yates).
   *  4. Apply category rules to split into one or two categories.
   *  5. Apply group rules within each category.
   */
  async calculateDivision(sessionId: number): Promise<DivisionResult> {
    // 1. Verify session exists
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new AppError('الجلسة غير موجودة', 404, 'SESSION_NOT_FOUND');
    }

    // 2. Fetch present attendances
    let attendances: Attendance[];
    try {
      attendances = await this.attendanceRepository.find({
        where: { session: { id: sessionId }, status: 'present' },
        relations: ['student'],
        order: { id: 'ASC' }
      });
    } catch (error) {
      throw new AppError('حدث خطأ أثناء جلب سجلات الحضور', 500, 'DB_ERROR');
    }

    // Map to plain StudentInfo objects
    const allStudents: StudentInfo[] = attendances.map(a => ({
      id: a.student.id,
      firstName: a.student.firstName,
      lastName: a.student.lastName,
      guardianName: a.student.guardianName,
      age: a.student.age
    }));

    const total = allStudents.length;

    // 3. Shuffle
    shuffleArray(allStudents);

    // 4. Apply category rules
    let message: string | undefined;
    let categoryStudents: [StudentInfo[], StudentInfo[]];

    if (total === 0) {
      // No students present
      return {
        sessionId,
        totalStudents: 0,
        categories: [],
        message: 'لا يوجد طلاب حاضرون في هذه الجلسة'
      };
    } else if (total < 15) {
      // Single category — everyone together
      categoryStudents = [allStudents, []];
    } else if (total <= 36) {
      // Two categories
      const rule = CATEGORY_DIVISION_RULES[total] as [number, number];
      const sizeA = rule[0];
      const sizeB = rule[1];
      categoryStudents = [
        allStudents.slice(0, sizeA),
        allStudents.slice(sizeA, sizeA + sizeB)
      ];
    } else {
      // More than 36 — warn and place all in a single category
      message = `عدد الطلاب (${total}) يتجاوز الحد الأقصى المدعوم (36). تم وضع جميع الطلاب في فئة واحدة.`;
      categoryStudents = [allStudents, []];
    }

    // 5. Build category objects
    const categories: Category[] = [];

    const categoryNames: string[] = ['أ', 'ب'];
    categoryStudents.forEach((students, index) => {
      if (students.length === 0) return; // skip empty second category (total < 15 case)

      const groups = buildGroups(students);
      const catName = categoryNames[index] ?? '';
      categories.push({
        name: catName,
        students,
        groups,
        count: students.length
      });
    });

    return {
      sessionId,
      totalStudents: total,
      categories,
      ...(message ? { message } : {})
    };
  }
}
