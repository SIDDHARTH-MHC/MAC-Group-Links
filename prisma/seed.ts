import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { loadOfficialCatalogue } from "../lib/catalogue/official";
import { importCatalogueRows } from "../lib/admin/import-papers";
import { seedMacCoursesFromFiles } from "./seed-courses-lib";

const prisma = new PrismaClient();

type DepartmentSeed = { name: string; departmentRoom: string | null };

/** Active semester catalogue semester number in papers-official.json */
const CATALOGUE_SEMESTER_NUMBER = 1;

async function main() {
  await prisma.groupReport.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.groupContribution.deleteMany();
  await prisma.group.deleteMany();
  await prisma.paperEligibility.deleteMany();
  await prisma.paper.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.adminAuditLog.deleteMany();

  const deptRaw = JSON.parse(
    readFileSync(join(__dirname, "data/departments.json"), "utf-8"),
  ) as DepartmentSeed[];

  await prisma.department.deleteMany();
  for (const d of deptRaw) {
    await prisma.department.create({
      data: {
        name: d.name,
        departmentRoom: d.departmentRoom,
      },
    });
  }

  await seedMacCoursesFromFiles(prisma);

  const semester = await prisma.semester.create({
    data: {
      academicYear: "2026-27",
      semesterNumber: CATALOGUE_SEMESTER_NUMBER,
      status: "ACTIVE",
    },
  });

  const catalogue = loadOfficialCatalogue();
  const rows = catalogue.filter(
    (r) =>
      r.semesterNumber === CATALOGUE_SEMESTER_NUMBER && !r.needsReview,
  );

  const { imported, errors } = await importCatalogueRows(semester.id, rows);
  if (errors.length > 0) {
    throw new Error(
      `Official catalogue import failed:\n${errors.slice(0, 20).join("\n")}`,
    );
  }

  const skippedReview = catalogue.filter(
    (r) =>
      r.semesterNumber === CATALOGUE_SEMESTER_NUMBER && r.needsReview,
  ).length;

  console.log("Seed complete (file-backed catalogue only):", {
    semester: `${semester.academicYear} sem ${semester.semesterNumber}`,
    papersImported: imported,
    papersSkippedNeedsReview: skippedReview,
    courses: (await prisma.course.count({ where: { active: true } })),
    departments: deptRaw.length,
    groups: 0,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
