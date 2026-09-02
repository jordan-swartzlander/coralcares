-- AlterEnum
ALTER TYPE "volunteer_status" ADD VALUE 'INVITED';

-- AlterTable
ALTER TABLE "volunteers" ADD COLUMN     "student_grade" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "volunteer_invites" (
    "id" SERIAL NOT NULL,
    "volunteer_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "invited_by_staff_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_invites_token_key" ON "volunteer_invites"("token");

-- AddForeignKey
ALTER TABLE "volunteer_invites" ADD CONSTRAINT "volunteer_invites_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_invites" ADD CONSTRAINT "volunteer_invites_invited_by_staff_id_fkey" FOREIGN KEY ("invited_by_staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
