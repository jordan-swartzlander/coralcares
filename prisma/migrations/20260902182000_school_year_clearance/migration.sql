/*
  Warnings:

  - You are about to drop the column `clearance_level` on the `volunteers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "volunteers" DROP COLUMN "clearance_level";

-- CreateTable
CREATE TABLE "volunteer_clearances" (
    "id" SERIAL NOT NULL,
    "volunteer_id" INTEGER NOT NULL,
    "school_year" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "approved_by_staff_id" INTEGER,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_clearances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "current_school_year" TEXT NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_clearances_volunteer_id_school_year_key" ON "volunteer_clearances"("volunteer_id", "school_year");

-- AddForeignKey
ALTER TABLE "volunteer_clearances" ADD CONSTRAINT "volunteer_clearances_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_clearances" ADD CONSTRAINT "volunteer_clearances_approved_by_staff_id_fkey" FOREIGN KEY ("approved_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the singleton settings row
INSERT INTO "app_settings" ("id", "current_school_year") VALUES (1, '2026-2027');
