-- AlterTable: Provider - AI summary of reviews
ALTER TABLE "Provider" ADD COLUMN "reviewsSummary" TEXT,
ADD COLUMN "reviewsSummaryUpdatedAt" TIMESTAMP(3);
