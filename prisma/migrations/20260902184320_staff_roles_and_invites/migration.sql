-- CreateEnum
CREATE TYPE "staff_role" AS ENUM ('OWNER', 'ADMINISTRATOR', 'STAFF');

-- CreateEnum
CREATE TYPE "staff_status" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'DENIED');

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "role" "staff_role" NOT NULL DEFAULT 'STAFF',
ADD COLUMN     "status" "staff_status" NOT NULL DEFAULT 'PENDING_APPROVAL';

-- CreateTable
CREATE TABLE "staff_invites" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "role" "staff_role" NOT NULL,
    "token" TEXT NOT NULL,
    "invited_by_staff_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_invites_token_key" ON "staff_invites"("token");

-- AddForeignKey
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_invited_by_staff_id_fkey" FOREIGN KEY ("invited_by_staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing staff accounts (created before roles existed) become active owners
UPDATE "staff" SET "role" = 'OWNER', "status" = 'ACTIVE';
