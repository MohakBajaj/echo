-- CreateIndex
CREATE INDEX "College_name_domain_idx" ON "College"("name", "domain");

-- CreateIndex
CREATE INDEX "User_collegeId_username_userHash_idx" ON "User"("collegeId", "username", "userHash");
