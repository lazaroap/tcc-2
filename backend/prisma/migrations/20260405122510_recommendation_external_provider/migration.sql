-- DropIndex
DROP INDEX "Recommendation_authorId_providerId_groupId_key";

-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "externalCategory" TEXT,
ADD COLUMN     "externalName" TEXT,
ADD COLUMN     "externalPhone" TEXT,
ALTER COLUMN "providerId" DROP NOT NULL;
