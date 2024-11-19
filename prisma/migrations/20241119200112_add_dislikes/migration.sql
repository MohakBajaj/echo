-- CreateTable
CREATE TABLE "Dislike" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Dislike_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateIndex
CREATE INDEX "Dislike_userId_idx" ON "Dislike"("userId");

-- CreateIndex
CREATE INDEX "Dislike_postId_idx" ON "Dislike"("postId");

-- AddForeignKey
ALTER TABLE "Dislike" ADD CONSTRAINT "Dislike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dislike" ADD CONSTRAINT "Dislike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
