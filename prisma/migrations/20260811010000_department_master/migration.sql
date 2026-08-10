-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentRoom" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- Seed departments from existing papers
INSERT INTO "Department" ("id", "name", "departmentRoom", "active", "createdAt", "updatedAt")
SELECT
    'cdep' || substr(md5("offeringDepartment"), 1, 21),
    "offeringDepartment",
    MAX("departmentRoom"),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Paper"
GROUP BY "offeringDepartment";

-- Suggestion department fields
ALTER TABLE "Suggestion" ADD COLUMN "suggestedDepartmentName" TEXT;
ALTER TABLE "Suggestion" ADD COLUMN "suggestedDepartmentRoom" TEXT;

UPDATE "Suggestion"
SET
    "suggestedDepartmentName" = "offeringDepartment",
    "suggestedDepartmentRoom" = "departmentRoom"
WHERE "offeringDepartment" IS NOT NULL;

ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "offeringDepartment";
ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "departmentRoom";

-- Paper -> departmentId
ALTER TABLE "Paper" ADD COLUMN "departmentId" TEXT;

UPDATE "Paper" p
SET "departmentId" = d."id"
FROM "Department" d
WHERE lower(trim(p."offeringDepartment")) = lower(trim(d."name"));

ALTER TABLE "Paper" ALTER COLUMN "departmentId" SET NOT NULL;

ALTER TABLE "Paper" DROP COLUMN "offeringDepartment";
ALTER TABLE "Paper" DROP COLUMN "departmentRoom";

DROP INDEX IF EXISTS "Paper_offeringDepartment_idx";

CREATE INDEX "Paper_departmentId_idx" ON "Paper"("departmentId");

CREATE UNIQUE INDEX "Paper_semesterId_paperType_paperName_departmentId_key"
ON "Paper"("semesterId", "paperType", "paperName", "departmentId");

ALTER TABLE "Paper" ADD CONSTRAINT "Paper_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Group normalized links
ALTER TABLE "Group" ADD COLUMN "normalizedGroupLink" TEXT;

UPDATE "Group"
SET "normalizedGroupLink" = lower(trim("groupLink"))
WHERE "groupLink" IS NOT NULL;

CREATE UNIQUE INDEX "Group_paperId_normalizedGroupLink_key"
ON "Group"("paperId", "normalizedGroupLink");

CREATE INDEX "Group_normalizedGroupLink_idx" ON "Group"("normalizedGroupLink");

DROP INDEX IF EXISTS "Group_paperId_groupLink_key";

-- GroupContribution normalized links
ALTER TABLE "GroupContribution" ADD COLUMN "normalizedGroupLink" TEXT;

UPDATE "GroupContribution"
SET "normalizedGroupLink" = lower(trim("groupLink"));

ALTER TABLE "GroupContribution" ALTER COLUMN "normalizedGroupLink" SET NOT NULL;

CREATE INDEX "GroupContribution_paperId_normalizedGroupLink_idx"
ON "GroupContribution"("paperId", "normalizedGroupLink");

-- Course unique name
CREATE UNIQUE INDEX IF NOT EXISTS "Course_name_key" ON "Course"("name");
