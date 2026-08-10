import { prisma } from "../lib/db/prisma";
import { seedMacCoursesFromFiles } from "./seed-courses-lib";

async function main() {
  await seedMacCoursesFromFiles(prisma);
  console.log("Upserted MAC courses from prisma/data/courses.json.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
