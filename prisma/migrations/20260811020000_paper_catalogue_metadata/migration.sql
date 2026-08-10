-- AlterEnum
ALTER TYPE "PaperType" ADD VALUE 'SBC';

-- AlterTable
ALTER TABLE "Paper" ADD COLUMN "dseNumber" TEXT;
ALTER TABLE "Paper" ADD COLUMN "seatCapacity" INTEGER;
ALTER TABLE "Paper" ADD COLUMN "prerequisite" TEXT;
ALTER TABLE "Paper" ADD COLUMN "sourceDocument" TEXT;
ALTER TABLE "Paper" ADD COLUMN "sourcePage" INTEGER;
ALTER TABLE "Paper" ADD COLUMN "sourceText" TEXT;
