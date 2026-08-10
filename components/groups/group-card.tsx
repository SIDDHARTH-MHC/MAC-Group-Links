import Link from "next/link";
import { ReportGroupButton } from "@/components/groups/report-group-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEligibility, PLATFORM_LABELS, getPaperTypeLabel } from "@/lib/constants";
import type { Group, Paper, Course, GroupEligibility } from "@prisma/client";

type GroupWithRelations = Group & {
  paper: Pick<Paper, "id" | "paperName" | "paperType">;
  eligibilities: (GroupEligibility & { course: Course | null })[];
};

export function GroupCard({ group }: { group: GroupWithRelations }) {
  const eligibilityText =
    group.eligibilities.length > 0
      ? group.eligibilities
          .map((e) =>
            formatEligibility(
              e.appliesToAll,
              e.course?.name,
              e.year,
              e.combination
            )
          )
          .join(" · ")
      : "All students taking this paper";

  return (
    <Card className="border-amber-100">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{group.sectionName}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {getPaperTypeLabel(group.paper.paperType).short}
          </Badge>
        </div>
        <p className="text-sm text-amber-900/70">{group.paper.paperName}</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-amber-900/60">For: </span>
          {eligibilityText}
        </p>
        {group.teacherName && (
          <p>
            <span className="text-amber-900/60">Teacher: </span>
            {group.teacherName}
          </p>
        )}
        {group.actualClassRoom && (
          <p>
            <span className="text-amber-900/60">Class room: </span>
            {group.actualClassRoom}
          </p>
        )}
        {(group.days || group.startTime) && (
          <p>
            <span className="text-amber-900/60">Schedule: </span>
            {[group.days, group.startTime, group.endTime && `– ${group.endTime}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {group.groupLink ? (
          <Button asChild className="mt-2 w-full bg-emerald-700 hover:bg-emerald-800">
            <a href={group.groupLink} target="_blank" rel="noopener noreferrer">
              Join {PLATFORM_LABELS[group.groupPlatform]} group
            </a>
          </Button>
        ) : (
          <p className="text-amber-800/60 italic">No link yet</p>
        )}
        <Link
          href={`/paper/${group.paperId}`}
          className="block text-center text-xs text-amber-800 underline"
        >
          View paper
        </Link>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Link href={`/suggest?groupId=${group.id}&paperId=${group.paperId}`} className="text-xs text-amber-800 underline">
            Suggest an edit
          </Link>
        </div>
        <ReportGroupButton groupId={group.id} paperId={group.paperId} />
      </CardContent>
    </Card>
  );
}
