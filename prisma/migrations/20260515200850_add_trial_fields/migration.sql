-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "trial_code_used" TEXT,
ADD COLUMN     "trial_expires_at" TIMESTAMP(3);
