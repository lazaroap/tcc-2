-- AlterTable: User - replace age with birthDate, preserving approximate value
ALTER TABLE "User" ADD COLUMN "birthDate" DATE;

UPDATE "User"
SET "birthDate" = (CURRENT_DATE - (("age")::text || ' years')::interval)::date
WHERE "age" IS NOT NULL;

ALTER TABLE "User" DROP COLUMN "age";

-- AlterTable: RequestReply - add phone and providerId
ALTER TABLE "RequestReply" ADD COLUMN "phone" TEXT,
ADD COLUMN "providerId" TEXT;

-- AddForeignKey
ALTER TABLE "RequestReply" ADD CONSTRAINT "RequestReply_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
