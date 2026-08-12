import { Suspense } from "react";
import Link from "next/link";
import { getActiveSemester } from "@/lib/db/semester";
import { listPapersForContribution } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";
import { getCourses } from "@/lib/actions/public";
import { ContributeForm } from "@/components/forms/contribute-form";
import { ContributeAccuracyDisclaimer } from "@/components/layout/info-disclaimer";
import { Button } from "@/components/ui/button";

type Props = { searchParams: Promise<{ paperId?: string }> };

export default async function ContributeAddPage({ searchParams }: Props) {
  const sp = await searchParams;
  const semester = await getActiveSemester();
  const papers = semester
    ? await listPapersForContribution(semester.id)
    : [];
  const courses = await getCourses();
  const selectedPaper = sp.paperId
    ? papers.find((p) => p.id === sp.paperId)
    : null;
  const unknownPaper =
    sp.paperId && !selectedPaper && semester
      ? await prisma.paper.findFirst({
          where: { id: sp.paperId, semesterId: semester.id },
          select: { paperName: true, paperType: true },
        })
      : null;

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/contribute">← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Add a Group Link
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          Help your classmates find their class group.
        </p>
        <ContributeAccuracyDisclaimer />
        {selectedPaper ? (
          <p className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Paper: </span>
            <span className="font-medium text-foreground">
              [{selectedPaper.paperType}] {selectedPaper.paperName}
            </span>
          </p>
        ) : unknownPaper ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            [{unknownPaper.paperType}] {unknownPaper.paperName} is not available
            to add a group link.
          </p>
        ) : null}
      </header>
      {!semester ? (
        <p className="text-muted-foreground">No active semester configured.</p>
      ) : papers.length === 0 ? (
        <p className="text-muted-foreground">
          No papers in the catalogue yet. You can{" "}
          <Link href="/suggest" className="text-primary underline">
            suggest a paper
          </Link>{" "}
          first.
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
