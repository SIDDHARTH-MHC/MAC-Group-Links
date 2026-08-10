import {
  PrismaClient,
  GroupPlatform,
  ContributorType,
  PaperType,
} from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { groupLinkFields } from "../lib/constants";

const prisma = new PrismaClient();

const SAMPLE_LINK = "https://example.com/sample-mac-group-do-not-use";

type SeedPaper = {
  paperType: string;
  department: string;
  paperName: string;
  eligibilityNotes?: string;
};

type DepartmentSeed = { name: string; departmentRoom: string | null };

async function main() {
  await prisma.groupReport.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.groupContribution.deleteMany();
  await prisma.group.deleteMany();
  await prisma.paperEligibility.deleteMany();
  await prisma.paper.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.course.deleteMany();
  await prisma.department.deleteMany();
  await prisma.adminAuditLog.deleteMany();

  const deptRaw = JSON.parse(
    readFileSync(join(__dirname, "data/departments.json"), "utf-8")
  ) as DepartmentSeed[];

  for (const d of deptRaw) {
    await prisma.department.create({
      data: {
        name: d.name,
        departmentRoom: d.departmentRoom,
      },
    });
  }

  const courses = [];
  const courseSeed = JSON.parse(
    readFileSync(join(__dirname, "data/courses.json"), "utf-8"),
  ) as { courses: { name: string; shortName: string }[] };

  for (const c of courseSeed.courses) {
    const row = await prisma.course.create({ data: c });
    courses.push(row);
  }

  const baProg = courses.find((c) => c.name === "B.A. Programme");
  if (!baProg) throw new Error("B.A. Programme course missing from seed");

  const semester = await prisma.semester.create({
    data: {
      academicYear: "2026-27",
      semesterNumber: 1,
      status: "ACTIVE",
    },
  });

  const raw = JSON.parse(
    readFileSync(join(__dirname, "data/papers-dev.json"), "utf-8")
  ) as { papers: SeedPaper[] };

  const paperRecords: { id: string; paperName: string }[] = [];
  const linkFields = groupLinkFields(SAMPLE_LINK);

  for (const p of raw.papers) {
    const dept = await prisma.department.findFirst({
      where: { name: { equals: p.department, mode: "insensitive" } },
    });
    if (!dept) {
      console.warn("Skipping paper — unknown department:", p.department, p.paperName);
      continue;
    }
    const paper = await prisma.paper.create({
      data: {
        semesterId: semester.id,
        paperType: p.paperType as PaperType,
        paperName: p.paperName,
        departmentId: dept.id,
        eligibilityNotes: p.eligibilityNotes,
        eligibilities: {
          create: [{ appliesToAll: true }],
        },
      },
    });
    paperRecords.push({ id: paper.id, paperName: paper.paperName });
  }

  const itSkills = paperRecords.find((p) =>
    p.paperName.includes("IT Skills and Data Analysis")
  );
  const personality = paperRecords.find((p) =>
    p.paperName.includes("Personality Development")
  );
  const digitalFilm = paperRecords.find((p) =>
    p.paperName.includes("Digital Film Production")
  );

  if (itSkills) {
    await prisma.group.create({
      data: {
        paperId: itSkills.id,
        sectionName: "Group A",
        teacherName: "Professor X (sample)",
        actualClassRoom: "301",
        days: "Tuesday, Friday",
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        groupPlatform: GroupPlatform.WHATSAPP,
        groupLink: linkFields.groupLink,
        normalizedGroupLink: linkFields.normalizedGroupLink,
        contributorType: ContributorType.OTHER,
        contributorName: "Dev seed",
        eligibilities: {
          create: [{ courseId: baProg.id, year: 2 }],
        },
      },
    });
  }

  if (personality) {
    await prisma.group.create({
      data: {
        paperId: personality.id,
        sectionName: "Section A",
        teacherName: "Sample Faculty",
        actualClassRoom: "205",
        groupPlatform: GroupPlatform.TELEGRAM,
        groupLink: linkFields.groupLink,
        normalizedGroupLink: linkFields.normalizedGroupLink,
        eligibilities: {
          create: [{ courseId: baProg.id, year: 2 }],
        },
      },
    });
  }

  if (digitalFilm) {
    await prisma.group.create({
      data: {
        paperId: digitalFilm.id,
        sectionName: "Section A",
        teacherName: "Vinod Kr Verma (sample)",
        actualClassRoom: "301",
        days: "Mon, Wed",
        startTime: "2:00 PM",
        groupPlatform: GroupPlatform.WHATSAPP,
        groupLink: linkFields.groupLink,
        normalizedGroupLink: linkFields.normalizedGroupLink,
        eligibilities: {
          create: [{ courseId: baProg.id, year: 2 }],
        },
      },
    });
    await prisma.group.create({
      data: {
        paperId: digitalFilm.id,
        sectionName: "Section B",
        teacherName: "Sample Teacher (3rd year)",
        actualClassRoom: "302",
        groupPlatform: GroupPlatform.WHATSAPP,
        groupLink: "https://example.com/sample-mac-group-section-b",
        normalizedGroupLink: groupLinkFields(
          "https://example.com/sample-mac-group-section-b"
        ).normalizedGroupLink,
        eligibilities: {
          create: [{ courseId: baProg.id, year: 3 }],
        },
      },
    });
  }

  console.log("Seed complete (development sample data only):", {
    semester: semester.academicYear,
    papers: paperRecords.length,
    courses: courses.length,
    departments: deptRaw.length,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
