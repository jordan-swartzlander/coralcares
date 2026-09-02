-- AlterTable
ALTER TABLE "volunteers" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_staff_id" INTEGER;

-- CreateTable
CREATE TABLE "staff" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_approved_by_staff_id_fkey" FOREIGN KEY ("approved_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
