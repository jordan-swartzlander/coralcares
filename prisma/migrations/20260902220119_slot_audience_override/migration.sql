-- AlterTable
ALTER TABLE "slots" ADD COLUMN     "audience_grade" TEXT,
ADD COLUMN     "audience_override" "opportunity_audience",
ADD COLUMN     "audience_teacher_id" INTEGER;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_audience_teacher_id_fkey" FOREIGN KEY ("audience_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
