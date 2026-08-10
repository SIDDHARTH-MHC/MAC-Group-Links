import { prisma } from "@/lib/db/prisma";
import { readFileSync } from "fs";
import { join } from "path";

/** Upsert MAC course master list without wiping papers. */
async function main() {
  const courseSeed = JSON.parse(
    readFileSync(join(process.cwd(), "prisma/data/courses.json"), "utf-8"),
  ) as { courses: { name: string; shortName: string }[] };

  for (const c of courseSeed.courses) {
    await prisma.course.upsert({
      where: { name: c.name },
      create: { name: c.name, shortName: c.shortName, active: true },
      update: { shortName: c.shortName, active: true },
    });
  }

  const inactive = await prisma.course.findMany({
    where: {
      name: { notIn: courseSeed.courses.map((c) => c.name) },
    },
  });
  if (inactive.length > 0) {
    console.log(
      "Note: legacy courses still in DB (not deleted):",
      inactive.map((c) => c.name).join(", "),
    );
  }

  console.log("Upserted", courseSeed.courses.length, "MAC courses.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
