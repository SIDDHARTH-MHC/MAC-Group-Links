import { Suspense } from "react";
import Link from "next/link";
import { getActiveSemester } from "@/lib/db/semester";
import { listPapersOpenForContribution } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";
import { paperHasActiveGroupLink, paperHasPendingContribution } from "@/lib/db/group-visibility";
import { getCourses } from "@/lib/actions/public";
import { ContributeForm } from "@/components/forms/contribute-form";
import { ContributeAccuracyDisclaimer } from "@/components/layout/info-disclaimer";
import { Button } from "@/components/ui/button";

type Props = { searchParams: Promise<{ paperId?: string }> };

export default async function ContributeAddPage({ searchParams }: Props) {
  const sp = await searchParams;
  const semester = await getActiveSemester();
  const papers = semester
    ? await listPapersOpenForContribution(semester.id)
    : [];
  const courses = await getCourses();
  const selectedPaper = sp.paperId
    ? papers.find((p) => p.id === sp.paperId)
    : null;
  const blockedPaperId =
    sp.paperId && !selectedPaper ? sp.paperId : undefined;
  const blockedPaper =
    blockedPaperId && semester
      ? await prisma.paper.findFirst({
          where: { id: blockedPaperId, semesterId: semester.id },
          select: { paperName: true, paperType: true },
        })
      : null;
  const blockedReason =
    blockedPaperId && semester
      ? (await paperHasActiveGroupLink(blockedPaperId))
        ? "already has a published group link"
        : (await paperHasPendingContribution(blockedPaperId))
          ? "already has a submission awaiting admin review"
          : "is not available to add"
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
        ) : blockedPaper ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            [{blockedPaper.paperType}] {blockedPaper.paperName} —{" "}
            {blockedReason}. Only admin can change or remove the link.
          </p>
        ) : null}
      </header>
      {papers.length === 0 ? (
        <p className="text-muted-foreground">
          Every paper in this semester already has a group link or one is pending
          review. You can{" "}
          <Link href="/suggest" className="text-primary underline">
            suggest a paper
          </Link>{" "}
          or browse existing links under Papers.
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
