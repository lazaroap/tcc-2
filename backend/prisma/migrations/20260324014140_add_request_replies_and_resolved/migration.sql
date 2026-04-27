-- AlterTable
ALTER TABLE "RecommendationRequest" ADD COLUMN     "resolved" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RequestReply" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestReply_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RequestReply" ADD CONSTRAINT "RequestReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestReply" ADD CONSTRAINT "RequestReply_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RecommendationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
