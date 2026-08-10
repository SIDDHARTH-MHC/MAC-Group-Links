import { Suspense } from "react";
import { getActiveSemester } from "@/lib/db/semester";
import { listCataloguePapersForSuggestions } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";
import { getCourses } from "@/lib/actions/public";
import { SuggestForms } from "@/components/forms/suggest-forms";
import type { PaperOption } from "@/components/forms/paper-combobox";

type Props = {
  searchParams: Promise<{ paperId?: string; groupId?: string; tab?: string }>;
};

export default async function SuggestPage({ searchParams }: Props) {
  const sp = await searchParams;
  const semester = await getActiveSemester();
  const [courses, paperRows, departmentRows] = await Promise.all([
    getCourses(),
    semester
      ? listCataloguePapersForSuggestions(semester.id)
      : Promise.resolve([]),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  const papers: PaperOption[] = paperRows.map((p) => ({
    id: p.id,
    paperName: p.paperName,
    paperType: p.paperType,
    departmentName: p.department.name,
  }));

  const defaultMode = sp.tab === "new" ? ("new" as const) : ("edit" as const);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Suggest an update
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          Help keep MAC Group Links accurate. All suggestions are reviewed by an
          admin before being published.
        </p>
      </header>

      {!semester ? (
        <p className="text-muted-foreground">No active semester configured.</p>
      ) : papers.length === 0 && defaultMode === "edit" ? (
        <p className="text-muted-foreground">
          No papers in the catalogue yet. You can still suggest a new paper
          below.
        </p>
      ) : null}

      <Suspense fallback={null}>
        <SuggestForms
          courses={courses}
          papers={papers}
          departments={departmentRows.map((d) => d.name)}
          paperId={sp.paperId}
          groupId={sp.groupId}
          defaultMode={defaultMode}
        />
      </Suspense>
    </div>
  );
}
