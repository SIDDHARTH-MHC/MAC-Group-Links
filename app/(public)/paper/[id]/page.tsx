import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveSemester } from "@/lib/db/semester";
import { getPublicPaper } from "@/lib/db/queries";
import { PAPER_TYPE_LABELS, formatEligibility } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaperGroupsList } from "@/components/groups/paper-groups-list";

type Props = { params: Promise<{ id: string }> };

export default async function PaperDetailPage({ params }: Props) {
  const { id } = await params;
  const semester = await getActiveSemester();
  if (!semester) {
    return <p>No active semester.</p>;
  }
  const paper = await getPublicPaper(id, semester.id);
  if (!paper) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="secondary">
          {PAPER_TYPE_LABELS[paper.paperType].short}
        </Badge>
        <h1 className="mt-2 text-2xl font-bold">{paper.paperName}</h1>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-amber-900/60">Offering department</dt>
            <dd className="font-medium">{paper.offeringDepartment}</dd>
          </div>
          {paper.departmentRoom && (
            <div>
              <dt className="text-amber-900/60">Department room</dt>
              <dd className="font-medium">{paper.departmentRoom}</dd>
            </div>
          )}
          {paper.eligibilities.length > 0 && (
            <div>
              <dt className="text-amber-900/60">Eligibility</dt>
              <dd className="space-y-1">
                {paper.eligibilities.map((e) => (
                  <p key={e.id}>
                    {formatEligibility(
                      e.appliesToAll,
                      e.course?.name,
                      e.year,
                      e.combination
                    )}
                  </p>
                ))}
              </dd>
            </div>
          )}
          {paper.sourceDocumentUrl && (
            <div>
              <a
                href={paper.sourceDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-900 underline"
              >
                Official source
              </a>
            </div>
          )}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" className="border-amber-200">
            <Link href={`/contribute?paperId=${paper.id}`}>+ Add group link</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/suggest?paperId=${paper.id}`}>Suggest an edit</Link>
          </Button>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Available groups</h2>
        <PaperGroupsList groups={paper.groups} paperId={paper.id} />
      </section>
    </div>
  );
}
