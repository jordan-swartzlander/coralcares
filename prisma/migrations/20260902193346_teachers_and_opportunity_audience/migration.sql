/*
  Warnings:

  - You are about to drop the column `student_teacher` on the `volunteers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "opportunity_audience" AS ENUM ('SCHOOL', 'GRADE', 'CLASSROOM');

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "audience" "opportunity_audience" NOT NULL DEFAULT 'SCHOOL',
ADD COLUMN     "audience_grade" TEXT,
ADD COLUMN     "audience_teacher_id" INTEGER;

-- AlterTable
ALTER TABLE "volunteers" DROP COLUMN "student_teacher",
ADD COLUMN     "student_teacher_id" INTEGER;

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_student_teacher_id_fkey" FOREIGN KEY ("student_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_audience_teacher_id_fkey" FOREIGN KEY ("audience_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
