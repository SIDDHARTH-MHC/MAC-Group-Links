import { prisma } from "@/lib/db/prisma";
import { getActiveSemester } from "@/lib/db/semester";
import { previewOfficialCatalogue } from "@/lib/catalogue/official";
import { OfficialCatalogueImportClient } from "@/components/admin/official-catalogue-import";

export default async function OfficialCatalogueImportPage() {
  const semesters = await prisma.semester.findMany({
    orderBy: [{ academicYear: "desc" }, { semesterNumber: "desc" }],
  });
  const active = await getActiveSemester();
  const preview = previewOfficialCatalogue();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Import official catalogue (PDF extract)</h1>
      <OfficialCatalogueImportClient
        semesters={semesters}
        activeSemesterId={active?.id ?? semesters[0]?.id ?? ""}
        preview={preview}
      />
    </div>
  );
}
