-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SemesterStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PaperType" AS ENUM ('SEC', 'VAC', 'GE', 'DSE', 'AEC', 'CORE');

-- CreateEnum
CREATE TYPE "GroupPlatform" AS ENUM ('WHATSAPP', 'TELEGRAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ContributorType" AS ENUM ('STUDENT', 'PROFESSOR', 'OTHER');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('PAPER_NAME_WRONG', 'WRONG_DEPARTMENT', 'WRONG_ELIGIBILITY', 'MISSING_COURSE_YEAR', 'WRONG_TEACHER', 'WRONG_SECTION', 'WRONG_CLASSROOM', 'WRONG_GROUP_LINK', 'LINK_EXPIRED', 'PAPER_MISSING', 'NEW_PAPER', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('LINK_DOESNT_WORK', 'WRONG_PAPER', 'WRONG_COURSE_YEAR', 'WRONG_SECTION', 'OLD_GROUP', 'NOT_COLLEGE_GROUP', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'IGNORED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'SEMESTER_CREATED', 'SEMESTER_ACTIVATED', 'SEMESTER_ARCHIVED', 'PAPER_CREATED', 'PAPER_UPDATED', 'PAPER_DELETED', 'PAPER_IMPORTED', 'GROUP_CREATED', 'GROUP_UPDATED', 'GROUP_DELETED', 'GROUP_APPROVED', 'GROUP_REJECTED', 'SUGGESTION_APPLIED', 'SUGGESTION_REJECTED', 'REPORT_HANDLED');

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "status" "SemesterStatus" NOT NULL DEFAULT 'ARCHIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paper" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "paperType" "PaperType" NOT NULL,
    "paperName" TEXT NOT NULL,
    "paperCode" TEXT,
    "offeringDepartment" TEXT NOT NULL,
    "departmentRoom" TEXT,
    "description" TEXT,
    "sourceDocumentUrl" TEXT,
    "eligibilityNotes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperEligibility" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "courseId" TEXT,
    "year" INTEGER,
    "combination" TEXT,
    "notes" TEXT,
    "appliesToAll" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PaperEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "sectionName" TEXT NOT NULL,
    "teacherName" TEXT,
    "actualClassRoom" TEXT,
    "days" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "groupPlatform" "GroupPlatform" NOT NULL DEFAULT 'WHATSAPP',
    "groupLink" TEXT,
    "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "linkVerifiedAt" TIMESTAMP(3),
    "contributorName" TEXT,
    "contributorType" "ContributorType",
    "contributionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupEligibility" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "courseId" TEXT,
    "year" INTEGER,
    "combination" TEXT,
    "notes" TEXT,
    "appliesToAll" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GroupEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupContribution" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "sectionName" TEXT,
    "teacherName" TEXT,
    "actualClassRoom" TEXT,
    "days" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "groupPlatform" "GroupPlatform" NOT NULL DEFAULT 'WHATSAPP',
    "groupLink" TEXT NOT NULL,
    "contributorName" TEXT,
    "contributorType" "ContributorType",
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "appliesToAll" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupContributionEligibility" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "courseId" TEXT,
    "year" INTEGER,
    "combination" TEXT,
    "notes" TEXT,
    "appliesToAll" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GroupContributionEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "type" "SuggestionType" NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedValue" TEXT,
    "paperId" TEXT,
    "groupId" TEXT,
    "paperType" "PaperType",
    "paperName" TEXT,
    "offeringDepartment" TEXT,
    "departmentRoom" TEXT,
    "sourceDocumentUrl" TEXT,
    "contributorName" TEXT,
    "contributorType" "ContributorType",
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionEligibility" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "courseId" TEXT,
    "year" INTEGER,
    "combination" TEXT,
    "notes" TEXT,
    "appliesToAll" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SuggestionEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupReport" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "reporterName" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Semester_status_idx" ON "Semester"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_academicYear_semesterNumber_key" ON "Semester"("academicYear", "semesterNumber");

-- CreateIndex
CREATE INDEX "Paper_semesterId_paperType_idx" ON "Paper"("semesterId", "paperType");

-- CreateIndex
CREATE INDEX "Paper_paperName_idx" ON "Paper"("paperName");

-- CreateIndex
CREATE INDEX "Paper_offeringDepartment_idx" ON "Paper"("offeringDepartment");

-- CreateIndex
CREATE INDEX "PaperEligibility_paperId_idx" ON "PaperEligibility"("paperId");

-- CreateIndex
CREATE INDEX "PaperEligibility_courseId_idx" ON "PaperEligibility"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_contributionId_key" ON "Group"("contributionId");

-- CreateIndex
CREATE INDEX "Group_paperId_idx" ON "Group"("paperId");

-- CreateIndex
CREATE INDEX "Group_groupLink_idx" ON "Group"("groupLink");

-- CreateIndex
CREATE UNIQUE INDEX "Group_paperId_groupLink_key" ON "Group"("paperId", "groupLink");

-- CreateIndex
CREATE INDEX "GroupEligibility_groupId_idx" ON "GroupEligibility"("groupId");

-- CreateIndex
CREATE INDEX "GroupContribution_status_idx" ON "GroupContribution"("status");

-- CreateIndex
CREATE INDEX "GroupContribution_paperId_idx" ON "GroupContribution"("paperId");

-- CreateIndex
CREATE INDEX "GroupContributionEligibility_contributionId_idx" ON "GroupContributionEligibility"("contributionId");

-- CreateIndex
CREATE INDEX "Suggestion_status_idx" ON "Suggestion"("status");

-- CreateIndex
CREATE INDEX "SuggestionEligibility_suggestionId_idx" ON "SuggestionEligibility"("suggestionId");

-- CreateIndex
CREATE INDEX "GroupReport_status_idx" ON "GroupReport"("status");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperEligibility" ADD CONSTRAINT "PaperEligibility_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperEligibility" ADD CONSTRAINT "PaperEligibility_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "GroupContribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupEligibility" ADD CONSTRAINT "GroupEligibility_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupEligibility" ADD CONSTRAINT "GroupEligibility_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupContribution" ADD CONSTRAINT "GroupContribution_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupContributionEligibility" ADD CONSTRAINT "GroupContributionEligibility_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "GroupContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupContributionEligibility" ADD CONSTRAINT "GroupContributionEligibility_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionEligibility" ADD CONSTRAINT "SuggestionEligibility_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionEligibility" ADD CONSTRAINT "SuggestionEligibility_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupReport" ADD CONSTRAINT "GroupReport_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupReport" ADD CONSTRAINT "GroupReport_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
