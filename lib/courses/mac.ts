import coursesData from "@/prisma/data/courses.json";

export const BA_PROGRAMME_COURSE_NAME = "B.A. Programme";

export const MAC_COURSES = coursesData.courses as {
  name: string;
  shortName: string;
}[];

/** Canonical combination strings (OMSP = Commerce stream at MAC). */
export const BA_PROGRAMME_COMBINATIONS =
  coursesData.baProgrammeCombinations as string[];

export function isBaProgrammeCourseName(name: string | null | undefined): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return (
    n === "b.a. programme" ||
    n === "ba programme" ||
    n === "b.a. prog." ||
    n === "b.a. prog"
  );
}

/** Normalize for matching: treat Commerce + X as OMSP + X. */
export function normalizeCombination(value: string): string {
  const trimmed = value.trim();
  return trimmed.replace(/^commerce\s+\+\s+/i, "OMSP + ");
}

export function formatCombinationLabel(value: string): string {
  return value.replace(/^OMSP\s+\+\s+/i, "Commerce + ");
}

export function combinationsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a?.trim() && !b?.trim()) return true;
  if (!a?.trim() || !b?.trim()) return false;
  return (
    normalizeCombination(a).toLowerCase() ===
    normalizeCombination(b).toLowerCase()
  );
}

/** Map PDF / legacy eligibility course strings to MAC course master names. */
export function resolveMacCourseName(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  const aliases: Record<string, string> = {
    "ba programme": BA_PROGRAMME_COURSE_NAME,
    "b.a. programme": BA_PROGRAMME_COURSE_NAME,
    "b.a. prog.": BA_PROGRAMME_COURSE_NAME,
    "b.a. prog": BA_PROGRAMME_COURSE_NAME,
    "b.a.prog.": BA_PROGRAMME_COURSE_NAME,
    "b.com.(h)": "B.Com. (Hons.)",
    "b.com.(hons.)": "B.Com. (Hons.)",
    "b.com (hons)": "B.Com. (Hons.)",
    "b.com. (hons.)": "B.Com. (Hons.)",
    "english (hons.)": "English (Hons.)",
    "english (hons)": "English (Hons.)",
    "eng hons": "English (Hons.)",
    "hindi (hons.)": "Hindi (Hons.)",
    "hindi(hons)": "Hindi (Hons.)",
    "hindi (hons)": "Hindi (Hons.)",
    bbe: "B.B.E. — Bachelor of Business Economics",
    "b.b.e.": "B.B.E. — Bachelor of Business Economics",
    "b.a.(hons.) business economics": "B.B.E. — Bachelor of Business Economics",
    "b.a. (hons) business economics": "B.B.E. — Bachelor of Business Economics",
    "journalism (hons.)": "Journalism (Hons.)",
    "journ(h)": "Journalism (Hons.)",
    "political science (hons.)": "Political Science (Hons.)",
    "pol.sc.(hons)": "Political Science (Hons.)",
    "b.sc. mathematical sciences": "B.Sc. Mathematical Sciences",
    "b.sc mathematical sciences": "B.Sc. Mathematical Sciences",
    "b.sc. physical sciences": "B.Sc. Physical Sciences",
    "phys.sc.": "B.Sc. Physical Sciences",
    ms: "B.Sc. Mathematical Sciences",
    ps: "B.Sc. Physical Sciences",
    "electronics (hons.)": "Electronics (Hons.)",
    "electronics(hons)": "Electronics (Hons.)",
  };
  if (aliases[key]) return aliases[key];
  const exact = MAC_COURSES.find((c) => c.name.toLowerCase() === key);
  return exact?.name ?? null;
}
