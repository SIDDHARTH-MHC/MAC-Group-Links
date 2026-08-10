import { Suspense } from "react";
import Link from "next/link";
import { getActiveSemester } from "@/lib/db/semester";
import { prisma } from "@/lib/db/prisma";
import { getCourses } from "@/lib/actions/public";
import { ContributeForm } from "@/components/forms/contribute-form";
import { Button } from "@/components/ui/button";

type Props = { searchParams: Promise<{ paperId?: string }> };

export default async function ContributeAddPage({ searchParams }: Props) {
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
  const selectedPaper = sp.paperId
    ? papers.find((p) => p.id === sp.paperId)
    : null;

  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/contribute">← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Add a Group Link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Help your classmates find their class group.
        </p>
        {selectedPaper ? (
          <p className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Paper: </span>
            <span className="font-medium text-foreground">
              {selectedPaper.paperName}
            </span>
          </p>
        ) : null}
      </div>
      {papers.length === 0 ? (
        <p className="text-muted-foreground">
          No papers in the active semester yet. You can{" "}
          <Link href="/suggest" className="text-primary underline">
            suggest a paper
          </Link>{" "}
          instead.
        </p>
      ) : (
        <Suspense fallback={null}>
          <ContributeForm
            papers={papers}
            courses={courses}
            initialPaperId={sp.paperId}
          />
        </Suspense>
      )}
    </div>
  );
}
