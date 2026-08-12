/**
 * Merge odd-sem catalogue rows (1+3+5+7) into the active semester.
 * Skips papers that already exist — groups and links are never touched.
 *
 * Usage: npx tsx scripts/import-odd-catalogue.ts
 */
import { PrismaClient } from "@prisma/client";
import { loadOfficialCatalogue } from "../lib/catalogue/official";
import { importCatalogueRows } from "../lib/admin/import-papers";

const ODD_SEMESTERS = [1, 3, 5, 7];

async function main() {
  const prisma = new PrismaClient();
  try {
    const semester = await prisma.semester.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    if (!semester) {
      throw new Error("No active semester in the database.");
    }

    const catalogue = loadOfficialCatalogue();
    const rows = catalogue.filter(
      (r) => ODD_SEMESTERS.includes(r.semesterNumber) && !r.needsReview,
    );

    const before = await prisma.paper.count({
      where: { semesterId: semester.id, archivedAt: null },
    });
    const groupsBefore = await prisma.group.count({
      where: { paper: { semesterId: semester.id } },
    });

    const { imported, skipped, errors } = await importCatalogueRows(
      semester.id,
      rows,
      { skipExisting: true },
    );

    const after = await prisma.paper.count({
      where: { semesterId: semester.id, archivedAt: null },
    });
    const groupsAfter = await prisma.group.count({
      where: { paper: { semesterId: semester.id } },
    });

    console.log(
      JSON.stringify(
        {
          semester: `${semester.academicYear} sem ${semester.semesterNumber}`,
          catalogueRows: rows.length,
          imported,
          skipped,
          errors: errors.slice(0, 10),
          papersBefore: before,
          papersAfter: after,
          groupsBefore,
          groupsAfter,
        },
        null,
        2,
      ),
    );

    if (groupsBefore !== groupsAfter) {
      console.warn(
        `Note: group count changed during import (${groupsBefore} → ${groupsAfter}). ` +
          "Paper import does not modify groups; this is likely from concurrent activity.",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
