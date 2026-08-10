import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getActiveSemester } from "@/lib/db/semester";
import { listDepartments, listPublicPapers } from "@/lib/db/queries";
import { getCourses } from "@/lib/actions/public";
import { paperTypeFromParam, getPaperTypeLabel } from "@/lib/constants";
import { PaperTypeBrowse } from "@/components/papers/paper-type-browse";

const TYPE_BLURBS: Partial<Record<string, string>> = {
  SEC: "Skill enhancement papers offered across departments.",
  VAC: "Value addition courses for the semester.",
  GE: "Generic electives open to eligible programmes.",
  DSE: "Discipline-specific electives for your programme.",
  AEC: "Ability enhancement courses including language options.",
  CORE: "Core papers from your programme catalogue.",
};

type Props = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ dept?: string; q?: string }>;
};

export default async function PapersByTypePage({ params, searchParams }: Props) {
  const { type: typeParam } = await params;
  const sp = await searchParams;
  const paperType = paperTypeFromParam(typeParam);
  if (!paperType) notFound();

  const semester = await getActiveSemester();
  if (!semester) {
    return (
      <p className="text-muted-foreground">No active semester configured.</p>
    );
  }

  const [departments, papers, courses] = await Promise.all([
    listDepartments(semester.id),
    listPublicPapers(semester.id, paperType, sp.dept, sp.q),
    getCourses(),
  ]);

  const meta = getPaperTypeLabel(paperType);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {meta.short}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
          {meta.title}
        </h1>
        {TYPE_BLURBS[paperType] ? (
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {TYPE_BLURBS[paperType]}
          </p>
        ) : null}
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <PaperTypeBrowse
          papers={papers}
          courses={courses}
          departments={departments}
          basePath={`/papers/${typeParam}`}
        />
      </Suspense>
    </div>
  );
}
