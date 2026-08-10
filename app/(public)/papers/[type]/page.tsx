import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveSemester } from "@/lib/db/semester";
import { listDepartments, listPublicPapers } from "@/lib/db/queries";
import { paperTypeFromParam, PAPER_TYPE_LABELS, formatEligibility } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { PaperFilters } from "@/components/papers/paper-filters";

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
    return <p className="text-amber-900/70">No active semester configured.</p>;
  }

  const departments = await listDepartments(semester.id);
  const papers = await listPublicPapers(
    semester.id,
    paperType,
    sp.dept,
    sp.q
  );

  const meta = PAPER_TYPE_LABELS[paperType];

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">{meta.short}</Badge>
        <h1 className="text-2xl font-bold">{meta.title}</h1>
      </div>

      <PaperFilters
        departments={departments}
        basePath={`/papers/${typeParam}`}
      />

      {papers.length === 0 ? (
        <p className="text-amber-900/70">No papers found.</p>
      ) : (
        <ul className="space-y-3">
          {papers.map((paper) => (
            <li key={paper.id}>
              <Link
                href={`/paper/${paper.id}`}
                className="block rounded-xl border border-amber-100 bg-white p-4 hover:border-amber-300 md:flex md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{paper.paperName}</p>
                  <p className="text-sm text-amber-900/60">
                    {paper.offeringDepartment}
                    {paper.departmentRoom
                      ? ` · Department room ${paper.departmentRoom}`
                      : ""}
                  </p>
                  {paper.eligibilities.length > 0 && (
                    <p className="mt-1 text-xs text-amber-800/70">
                      {paper.eligibilities
                        .slice(0, 3)
                        .map((e) =>
                          formatEligibility(
                            e.appliesToAll,
                            e.course?.name,
                            e.year,
                            e.combination
                          )
                        )
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <span className="mt-2 inline-block text-sm text-amber-800 md:mt-0">
                  {paper._count.groups} group
                  {paper._count.groups === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
