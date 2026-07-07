import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema migration - creates all 6 tables:
 *   users, sessions, students, activities, points, attendances
 *
 * Matches the TypeORM entity definitions in src/modules (each entity subfolder).
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------
    // 1. Enable uuid-ossp extension for gen_random_uuid()
    // ------------------------------------------------------------------
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ------------------------------------------------------------------
    // 2. users
    //    Uses UUID PK (TypeORM PrimaryGeneratedColumn('uuid'))
    //    Extra columns from the actual entity: full_name, role (enum),
    //    is_active, last_login_at
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM ('admin', 'teacher', 'viewer')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
        "username"      VARCHAR(100)  NOT NULL,
        "password"      VARCHAR(255)  NOT NULL,
        "full_name"     VARCHAR(255)  NOT NULL,
        "role"          "public"."users_role_enum" NOT NULL DEFAULT 'viewer',
        "is_active"     BOOLEAN       NOT NULL DEFAULT true,
        "last_login_at" TIMESTAMP     NULL,
        "created_at"    TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id"       PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username")
      )
    `);

    // ------------------------------------------------------------------
    // 3. sessions
    //    session_number is UNIQUE; both session_number and session_date
    //    have named indexes (matching @Index decorators on the entity).
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id"             SERIAL        NOT NULL,
        "session_number" INTEGER       NOT NULL,
        "session_date"   DATE          NOT NULL,
        "created_at"     TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions_id"          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sessions_session_number" UNIQUE ("session_number")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_session_number" ON "sessions" ("session_number")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_session_date" ON "sessions" ("session_date")`
    );

    // ------------------------------------------------------------------
    // 4. students
    //    guardian_name is NOT NULL in the entity (no nullable: true).
    //    notes is nullable.
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "students" (
        "id"            SERIAL        NOT NULL,
        "first_name"    VARCHAR(100)  NOT NULL,
        "last_name"     VARCHAR(100)  NOT NULL,
        "guardian_name" VARCHAR(100)  NOT NULL,
        "age"           INTEGER       NOT NULL,
        "notes"         TEXT          NULL,
        "created_at"    TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_students_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_students_age" CHECK ("age" > 0 AND "age" < 100)
      )
    `);

    // ------------------------------------------------------------------
    // 5. activities
    //    FKs: session_id → sessions(id) ON DELETE CASCADE
    //         student_id → students(id) ON DELETE CASCADE
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id"            SERIAL        NOT NULL,
        "session_id"    INTEGER       NOT NULL,
        "student_id"    INTEGER       NOT NULL,
        "activity_type" VARCHAR(50)   NOT NULL,
        "count"         INTEGER       NOT NULL,
        "created_at"    TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activities_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_activities_count" CHECK ("count" >= 0),
        CONSTRAINT "FK_activities_session" FOREIGN KEY ("session_id")
          REFERENCES "sessions" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_activities_student" FOREIGN KEY ("student_id")
          REFERENCES "students" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_activities_session_id" ON "activities" ("session_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activities_student_id" ON "activities" ("student_id")`
    );

    // ------------------------------------------------------------------
    // 6. points
    //    action is nullable; FKs cascade on delete.
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "points" (
        "id"         SERIAL        NOT NULL,
        "session_id" INTEGER       NOT NULL,
        "student_id" INTEGER       NOT NULL,
        "reason"     VARCHAR(255)  NOT NULL,
        "points"     INTEGER       NOT NULL,
        "action"     VARCHAR(100)  NULL,
        "created_at" TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_points_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_points_session" FOREIGN KEY ("session_id")
          REFERENCES "sessions" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_points_student" FOREIGN KEY ("student_id")
          REFERENCES "students" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_points_session_id" ON "points" ("session_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_points_student_id" ON "points" ("student_id")`
    );

    // ------------------------------------------------------------------
    // 7. attendances
    //    status defaults to 'present'; notes nullable.
    //    Unique composite index on (session_id, student_id) matching
    //    @Index('idx_attendances_unique', ['session', 'student'], { unique: true })
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "attendances" (
        "id"         SERIAL        NOT NULL,
        "session_id" INTEGER       NOT NULL,
        "student_id" INTEGER       NOT NULL,
        "status"     VARCHAR(50)   NOT NULL DEFAULT 'present',
        "notes"      TEXT          NULL,
        "created_at" TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendances_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attendances_session" FOREIGN KEY ("session_id")
          REFERENCES "sessions" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_attendances_student" FOREIGN KEY ("student_id")
          REFERENCES "students" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_attendances_unique" ON "attendances" ("session_id", "student_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attendances_session_id" ON "attendances" ("session_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attendances_student_id" ON "attendances" ("student_id")`
    );
  }

  // --------------------------------------------------------------------
  // down() — drop in reverse order to respect FK constraints
  // --------------------------------------------------------------------
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop child tables first
    await queryRunner.query(`DROP TABLE IF EXISTS "attendances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "points"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activities"`);

    // Drop parent tables
    await queryRunner.query(`DROP TABLE IF EXISTS "students"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);

    // Drop users (independent)
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
  }
}
