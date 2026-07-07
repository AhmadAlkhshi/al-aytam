/**
 * Unit Tests for Division Logic
 * Task 5.1.1 – division logic only
 *
 * Tests cover:
 *  - CATEGORY_DIVISION_RULES (all 22 entries, 15–36)
 *  - GROUP_DIVISION_RULES (all 14 entries, 5–18)
 *  - buildGroups() edge cases (< 5, > 18)
 *  - applyCategoryDivision() edge cases (< 15, > 36)
 *  - Property 4: A + B == total
 *  - Property 5: sum(groups) == category size
 *  - Property 6: every student appears exactly once across all groups
 */

import {
  CATEGORY_DIVISION_RULES,
  GROUP_DIVISION_RULES,
  buildGroups,
  applyCategoryDivision,
  StudentInfo,
} from './division.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a list of n fake students with sequential IDs */
function makeStudents(n: number): StudentInfo[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    firstName: 'طالب',
    lastName: String(i + 1),
    guardianName: `ولي${i + 1}`,
    age: 10,
  }));
}

// ─── Category Division Rules ──────────────────────────────────────────────────

describe('CATEGORY_DIVISION_RULES', () => {
  it('should have exactly 22 entries (15 through 36)', () => {
    const keys = Object.keys(CATEGORY_DIVISION_RULES).map(Number);
    expect(keys).toHaveLength(22);
    expect(Math.min(...keys)).toBe(15);
    expect(Math.max(...keys)).toBe(36);
  });

  // Exhaustively verify each entry
  const expectedRules: [number, number, number][] = [
    [15, 9, 6],   [16, 8, 8],   [17, 9, 8],   [18, 9, 9],
    [19, 10, 9],  [20, 10, 10], [21, 12, 9],  [22, 12, 10],
    [23, 14, 9],  [24, 12, 12], [25, 15, 10], [26, 14, 12],
    [27, 15, 12], [28, 16, 12], [29, 15, 14], [30, 15, 15],
    [31, 16, 15], [32, 16, 16], [33, 18, 15], [34, 18, 16],
    [35, 18, 17], [36, 18, 18],
  ];

  test.each(expectedRules)(
    'total=%i → categoryA=%i, categoryB=%i',
    (total, expectedA, expectedB) => {
      const rule = CATEGORY_DIVISION_RULES[total];
      expect(rule).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [a, b] = rule!;
      expect(a).toBe(expectedA);
      expect(b).toBe(expectedB);
    }
  );

  it('should have A + B = total for every rule (Property 4 – rule table integrity)', () => {
    for (let n = 15; n <= 36; n++) {
      const rule = CATEGORY_DIVISION_RULES[n];
      expect(rule).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [a, b] = rule!;
      expect(a + b).toBe(n);
    }
  });
});

// ─── Group Division Rules ─────────────────────────────────────────────────────

describe('GROUP_DIVISION_RULES', () => {
  it('should have exactly 14 entries (5 through 18)', () => {
    const keys = Object.keys(GROUP_DIVISION_RULES).map(Number);
    expect(keys).toHaveLength(14);
    expect(Math.min(...keys)).toBe(5);
    expect(Math.max(...keys)).toBe(18);
  });

  // Exhaustively verify each entry
  const expectedGroups: [number, number[]][] = [
    [5,  [5]],
    [6,  [3, 3]],
    [7,  [7]],
    [8,  [4, 4]],
    [9,  [3, 3, 3]],
    [10, [5, 5]],
    [11, [11]],
    [12, [4, 4, 4]],
    [13, [13]],
    [14, [7, 7]],
    [15, [5, 5, 5]],
    [16, [4, 4, 4, 4]],
    [17, [17]],
    [18, [6, 6, 6]],
  ];

  test.each(expectedGroups)(
    'count=%i → groups=%j',
    (count, expectedSizes) => {
      expect(GROUP_DIVISION_RULES[count]).toEqual(expectedSizes);
    }
  );

  it('should have sum(groups) = count for every rule (Property 5 – rule table integrity)', () => {
    for (let n = 5; n <= 18; n++) {
      const sizes = GROUP_DIVISION_RULES[n];
      expect(sizes).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const sum = sizes!.reduce((acc, s) => acc + s, 0);
      expect(sum).toBe(n);
    }
  });
});

// ─── buildGroups() ────────────────────────────────────────────────────────────

describe('buildGroups()', () => {
  it('should return a single group for fewer than 5 students', () => {
    for (let n = 0; n <= 4; n++) {
      const students = makeStudents(n);
      const groups = buildGroups(students);
      expect(groups).toHaveLength(1);
      expect(groups[0]!.students).toHaveLength(n);
    }
  });

  it('should apply GROUP_DIVISION_RULES for counts 5–18', () => {
    for (let n = 5; n <= 18; n++) {
      const students = makeStudents(n);
      const groups = buildGroups(students);
      const expectedSizes = GROUP_DIVISION_RULES[n]!;

      expect(groups).toHaveLength(expectedSizes.length);
      groups.forEach((g, i) => {
        const expectedSize = expectedSizes[i] as number;
        expect(g.students).toHaveLength(expectedSize);
        expect(g.count).toBe(expectedSize);
        expect(g.groupNumber).toBe(i + 1);
      });
    }
  });

  it('should return a single group when count > 18 (no rule found)', () => {
    const students = makeStudents(20);
    const groups = buildGroups(students);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.students).toHaveLength(20);
  });

  it('Property 5: sum of all group sizes equals total students for counts 5–18', () => {
    for (let n = 5; n <= 18; n++) {
      const students = makeStudents(n);
      const groups = buildGroups(students);
      const total = groups.reduce((sum, g) => sum + g.students.length, 0);
      expect(total).toBe(n);
    }
  });

  it('Property 6: no student is duplicated or lost across groups (counts 1–18)', () => {
    for (let n = 1; n <= 18; n++) {
      const students = makeStudents(n);
      const groups = buildGroups(students);
      const allIds = groups.flatMap(g => g.students.map(s => s.id));

      // No duplicates
      expect(new Set(allIds).size).toBe(allIds.length);
      // No losses
      expect(allIds.length).toBe(n);
    }
  });
});

// ─── applyCategoryDivision() ──────────────────────────────────────────────────

describe('applyCategoryDivision()', () => {
  it('should return empty categories for 0 students', () => {
    const result = applyCategoryDivision([]);
    expect(result.categories).toHaveLength(0);
    expect(result.message).toBeUndefined();
  });

  it('should return a single category (أ) for 1–14 students', () => {
    for (let n = 1; n <= 14; n++) {
      const students = makeStudents(n);
      const result = applyCategoryDivision(students);
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0]!.name).toBe('أ');
      expect(result.categories[0]!.count).toBe(n);
    }
  });

  it('should return two categories (أ) and (ب) for 15–36 students', () => {
    for (let n = 15; n <= 36; n++) {
      const students = makeStudents(n);
      const result = applyCategoryDivision(students);
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0]!.name).toBe('أ');
      expect(result.categories[1]!.name).toBe('ب');
    }
  });

  it('should return a single category with a warning message for > 36 students', () => {
    for (const n of [37, 40, 50]) {
      const students = makeStudents(n);
      const result = applyCategoryDivision(students);
      expect(result.categories).toHaveLength(1);
      expect(result.message).toBeDefined();
      expect(result.message).toContain(String(n));
    }
  });

  // Property 4 ──────────────────────────────────────────────────────────────
  describe('Property 4: categoryA.count + categoryB.count === total (15–36)', () => {
    const counts = Array.from({ length: 22 }, (_, i) => i + 15);

    test.each(counts)('total = %i', (n) => {
      const students = makeStudents(n);
      const { categories } = applyCategoryDivision(students);
      const sumAB = categories.reduce((sum, cat) => sum + cat.count, 0);
      expect(sumAB).toBe(n);
    });
  });

  // Property 5 ──────────────────────────────────────────────────────────────
  it('Property 5: sum(group sizes) === category.count for every category, counts 1–36', () => {
    for (let n = 1; n <= 36; n++) {
      const students = makeStudents(n);
      const { categories } = applyCategoryDivision(students);
      for (const cat of categories) {
        const groupTotal = cat.groups.reduce((sum, g) => sum + g.students.length, 0);
        expect(groupTotal).toBe(cat.count);
      }
    }
  });

  // Property 6 ──────────────────────────────────────────────────────────────
  it('Property 6: every student appears exactly once across all groups, counts 1–36', () => {
    for (let n = 1; n <= 36; n++) {
      const students = makeStudents(n);
      const { categories } = applyCategoryDivision(students);

      const allIds = categories.flatMap(cat =>
        cat.groups.flatMap(g => g.students.map(s => s.id))
      );

      // No student lost
      expect(allIds.length).toBe(n);

      // No student duplicated
      expect(new Set(allIds).size).toBe(n);

      // The exact same set of IDs from the input appears in the output
      const inputIds = students.map(s => s.id).sort((a, b) => a - b);
      const outputIds = [...allIds].sort((a, b) => a - b);
      expect(outputIds).toEqual(inputIds);
    }
  });

  it('Property 6: holds for over-36 case (single category fallback)', () => {
    const n = 40;
    const students = makeStudents(n);
    const { categories } = applyCategoryDivision(students);

    const allIds = categories.flatMap(cat =>
      cat.groups.flatMap(g => g.students.map(s => s.id))
    );

    expect(allIds.length).toBe(n);
    expect(new Set(allIds).size).toBe(n);
  });

  // Exact category sizes from the rule table ────────────────────────────────
  describe('exact category sizes match the rule table', () => {
    const expectedRules: [number, number, number][] = [
      [15, 9, 6],   [16, 8, 8],   [17, 9, 8],   [18, 9, 9],
      [19, 10, 9],  [20, 10, 10], [21, 12, 9],  [22, 12, 10],
      [23, 14, 9],  [24, 12, 12], [25, 15, 10], [26, 14, 12],
      [27, 15, 12], [28, 16, 12], [29, 15, 14], [30, 15, 15],
      [31, 16, 15], [32, 16, 16], [33, 18, 15], [34, 18, 16],
      [35, 18, 17], [36, 18, 18],
    ];

    test.each(expectedRules)(
      'total=%i → A=%i, B=%i',
      (total, expectedA, expectedB) => {
        const students = makeStudents(total);
        const { categories } = applyCategoryDivision(students);
        expect(categories[0]!.count).toBe(expectedA);
        expect(categories[1]!.count).toBe(expectedB);
      }
    );
  });
});
