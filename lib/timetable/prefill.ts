import prefillData from "@/lib/data/timetable-prefill-2026-odd.json";

export type TimetablePrefillRow = {
  paperType: string;
  courseCode: string;
  code: string;
  sectionName: string | null;
  teacherName: string | null;
  actualClassRoom: string;
  timetableTitle: string;
  days: string | null;
  startTime: string | null;
  endTime: string | null;
  cataloguePaperName: string | null;
};

export type TimetablePrefillBundle = {
  academicYear: string;
  semesterNote: string;
  sources: string[];
  prefill: TimetablePrefillRow[];
  missingInCatalogue: {
    paperType: string;
    courseCode: string;
    timetableTitle: string;
    teacherSample: string | null;
  }[];
  catalogueNotInTimetable: Record<string, string[]>;
};

const bundle = prefillData as TimetablePrefillBundle;

function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getTimetablePrefillBundle(): TimetablePrefillBundle {
  return bundle;
}

/** Merge timetable rows for the same catalogue paper (multiple sections/days). */
export function lookupTimetablePrefill(
  paperType: string,
  paperName: string,
): TimetablePrefillRow | null {
  const target = normalizeName(paperName);
  const rows = bundle.prefill.filter(
    (r) =>
      r.paperType === paperType &&
      r.cataloguePaperName &&
      normalizeName(r.cataloguePaperName) === target,
  );
  const fuzzy =
    rows.length > 0
      ? rows
      : bundle.prefill.filter((r) => {
          if (r.paperType !== paperType || !r.cataloguePaperName) return false;
          const cat = normalizeName(r.cataloguePaperName);
          return cat.includes(target) || target.includes(cat);
        });
  if (fuzzy.length === 0) return null;
  if (fuzzy.length === 1) return fuzzy[0];

  const days = new Set<string>();
  for (const r of fuzzy) {
    if (r.days) {
      for (const d of r.days.split(",").map((s) => s.trim())) {
        if (d) days.add(d);
      }
    }
  }
  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ];
  const mergedDays = dayOrder.filter((d) => days.has(d)).join(", ");

  const withTeacher = fuzzy.find((r) => r.teacherName) ?? fuzzy[0];
  const withRoom = fuzzy.find((r) => r.actualClassRoom) ?? fuzzy[0];
  const withTime = fuzzy.find((r) => r.startTime) ?? fuzzy[0];

  return {
    ...withTeacher,
    actualClassRoom: withRoom.actualClassRoom,
    days: mergedDays || withTeacher.days,
    startTime: withTime.startTime,
    endTime: withTime.endTime,
    sectionName: withTeacher.sectionName ?? fuzzy[0].sectionName,
  };
}
