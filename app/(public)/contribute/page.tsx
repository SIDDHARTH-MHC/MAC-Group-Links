import { Suspense } from "react";
import { getActiveSemester } from "@/lib/db/semester";
import { prisma } from "@/lib/db/prisma";
import { getCourses } from "@/lib/actions/public";
import { BA_PROGRAMME_COMBINATIONS } from "@/lib/courses/mac";
import { ContributeForm } from "@/components/forms/contribute-form";

type Props = { searchParams: Promise<{ paperId?: string }> };

export default async function ContributePage({ searchParams }: Props) {
  const sp = await searchParams;
  const semester = await getActiveSemester();
  const papers = semester
    ? await prisma.paper.findMany({
        where: { semesterId: semester.id, archivedAt: null },
        select: { id: true, paperName: true, paperType: true },
        orderBy: { paperName: "asc" },
      })
    : [];
  const courses = await getCourses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add a group link</h1>
        <p className="text-sm text-amber-900/70">
          Submissions are reviewed by admin before appearing publicly.
        </p>
      </div>
      {papers.length === 0 ? (
        <p className="text-amber-900/70">
          No papers in the active semester yet. You can still{" "}
          <a href="/suggest" className="underline">
            suggest a paper
          </a>
          .
        </p>
      ) : (
        <Suspense fallback={null}>
          <ContributeForm
            papers={papers}
            courses={courses}
            baCombinations={BA_PROGRAMME_COMBINATIONS}
            initialPaperId={sp.paperId}
          />
        </Suspense>
      )}
    </div>
  );
}
