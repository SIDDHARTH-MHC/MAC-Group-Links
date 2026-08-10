import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveSemester } from "@/lib/db/semester";
import { getPublicPaper } from "@/lib/db/queries";
import {
  PAPER_TYPE_LABELS,
  formatEligibility,
  YEAR_LABELS,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaperGroupsList } from "@/components/groups/paper-groups-list";

type Props = { params: Promise<{ id: string }> };

function EligibilityBadge({
  appliesToAll,
  courseName,
  year,
  combination,
}: {
  appliesToAll: boolean;
  courseName?: string | null;
  year?: number | null;
  combination?: string | null;
}) {
  if (appliesToAll) {
    return (
      <Badge variant="secondary" className="font-normal">
        All students taking this paper
      </Badge>
    );
  }
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {courseName ? (
        <Badge variant="secondary" className="font-normal">
          {courseName}
        </Badge>
      ) : null}
      {year ? (
        <Badge variant="outline" className="font-normal">
          {YEAR_LABELS[year] ?? `Year ${year}`}
        </Badge>
      ) : null}
      {combination ? (
        <Badge variant="outline" className="font-normal">
          {combination}
        </Badge>
      ) : null}
      {!courseName && !year && !combination ? (
        <Badge variant="secondary" className="font-normal">
          {formatEligibility(appliesToAll, courseName, year, combination)}
        </Badge>
      ) : null}
    </span>
  );
}

export default async function PaperDetailPage({ params }: Props) {
  const { id } = await params;
  const semester = await getActiveSemester();
  if (!semester) {
    return <p className="text-muted-foreground">No active semester.</p>;
  }
  const paper = await getPublicPaper(id, semester.id);
  if (!paper) notFound();

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Badge variant="secondary">{PAPER_TYPE_LABELS[paper.paperType].short}</Badge>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {paper.paperName}
        </h1>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Offering Department</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {paper.department.name}
            </dd>
          </div>
          {paper.department.departmentRoom ? (
            <div>
              <dt className="text-muted-foreground">Department Room</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {paper.department.departmentRoom}
              </dd>
            </div>
          ) : null}
        </dl>
        {paper.eligibilities.length > 0 ? (
          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="text-lg font-semibold text-foreground">
              Who can take this paper?
            </h2>
            <div className="flex flex-col gap-2">
              {paper.eligibilities.map((e) => (
                <div key={e.id}>
                  <EligibilityBadge
                    appliesToAll={e.appliesToAll}
                    courseName={e.course?.name}
                    year={e.year}
                    combination={e.combination}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {paper.sourceDocumentUrl ? (
          <p>
            <a
              href={paper.sourceDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              View official source
            </a>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild size="lg">
            <Link href={`/contribute/add?paperId=${paper.id}`}>
              + Add Group Link
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/suggest?paperId=${paper.id}`}>Suggest an edit</Link>
          </Button>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Available Groups
        </h2>
        <PaperGroupsList groups={paper.groups} paperId={paper.id} />
      </section>
    </div>
  );
}
