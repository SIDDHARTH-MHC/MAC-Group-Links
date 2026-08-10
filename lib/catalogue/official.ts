import { readFileSync } from "fs";
import { join } from "path";
import { officialCatalogueImportSchema } from "@/lib/validations";

const OFFICIAL_PATH = join(
  process.cwd(),
  "prisma/data/papers-official.json",
);

export function loadOfficialCatalogue() {
  const raw = JSON.parse(readFileSync(OFFICIAL_PATH, "utf-8")) as unknown;
  const parsed = officialCatalogueImportSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid papers-official.json",
    );
  }
  return parsed.data;
}

export function previewOfficialCatalogue(semesterNumber?: number) {
  const rows = loadOfficialCatalogue();
  const filtered = semesterNumber
    ? rows.filter((r) => r.semesterNumber === semesterNumber)
    : rows;
  return {
    total: rows.length,
    filtered: filtered.length,
    needsReview: filtered.filter((r) => r.needsReview).length,
    rows: filtered,
  };
}
