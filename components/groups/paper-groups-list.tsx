"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatEligibility,
  joinGroupButtonLabel,
} from "@/lib/constants";
import {
  useCourseYearPrefs,
  matchesEligibility,
  formatPrefsLabel,
} from "@/lib/preferences/course-year";
import type {
  Group,
  GroupEligibility,
  Course,
  GroupPlatform,
  ContributorType,
} from "@prisma/client";
import { ReportGroupDialog } from "@/components/groups/report-group-dialog";

export type GroupRow = Group & {
  eligibilities: (GroupEligibility & { course: Course | null })[];
};

function contributorLine(type: ContributorType | null): string | null {
  if (type === "PROFESSOR") return "Added by professor";
  if (type === "STUDENT") return "Added by student";
  return null;
}

export function PaperGroupsList({
  groups,
  paperId,
}: {
  groups: GroupRow[];
  paperId: string;
}) {
  const { prefs, loaded } = useCourseYearPrefs();

  const visible = loaded
    ? groups.filter((g) => {
        if (g.eligibilities.length === 0) return true;
        return g.eligibilities.some((e) =>
          matchesEligibility(
            e.appliesToAll,
            e.courseId,
            e.year,
            e.combination,
            prefs,
          ),
        );
      })
    : groups;

  if (visible.length === 0) {
    if (groups.length > 0) {
      return (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
          <p className="font-medium text-foreground">
            No groups match your course selection.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Update{" "}
            <Link href="/my-course" className="text-primary underline-offset-2 hover:underline">
              My Course
            </Link>{" "}
            to see the right group, or clear filters above.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
        <p className="font-medium text-foreground">
          No group link has been added yet.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Help your classmates by adding the group link.
        </p>
        <Button asChild className="mt-6" size="lg">
          <Link href={`/contribute/add?paperId=${paperId}`}>
            + Add Group Link
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prefs && (
        <p className="text-sm text-muted-foreground">
          Prioritizing groups for{" "}
          <span className="font-medium text-foreground">
            {formatPrefsLabel(prefs)}
          </span>
          .{" "}
          <Link href="/my-course" className="text-primary underline-offset-2 hover:underline">
            Change
          </Link>
        </p>
      )}
      {visible.map((group) => (
        <article
          key={group.id}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {group.sectionName}
            </h3>
            {group.linkVerifiedAt ? (
              <Badge variant="secondary" className="shrink-0">
                Verified
              </Badge>
            ) : null}
          </div>
          {group.eligibilities.length > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {group.eligibilities
                .map((e) =>
                  formatEligibility(
                    e.appliesToAll,
                    e.course?.name,
                    e.year,
                    e.combination,
                  ),
                )
                .join(" · ")}
            </p>
          ) : null}
          <dl className="mt-4 space-y-2 text-sm">
            {group.teacherName ? (
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <dt className="text-muted-foreground">Teacher</dt>
                <dd className="font-medium text-foreground">
                  {group.teacherName}
                </dd>
              </div>
            ) : null}
            {group.actualClassRoom ? (
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <dt className="text-muted-foreground">Class Room</dt>
                <dd className="font-medium text-foreground">
                  {group.actualClassRoom}
                </dd>
              </div>
            ) : null}
            {(group.days || group.startTime || group.endTime) && (
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <dt className="text-muted-foreground">Schedule</dt>
                <dd className="font-medium text-foreground">
                  {[group.days, group.startTime, group.endTime && `– ${group.endTime}`]
                    .filter(Boolean)
                    .join(" · ")}
                </dd>
              </div>
            )}
          </dl>
          {group.groupLink ? (
            <Button
              asChild
              className="mt-5 h-11 w-full text-base sm:w-auto sm:min-w-[14rem]"
              size="lg"
            >
              <a
                href={group.groupLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {joinGroupButtonLabel(group.groupPlatform as GroupPlatform)}
              </a>
            </Button>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Link not available yet.
            </p>
          )}
          {contributorLine(group.contributorType) ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {contributorLine(group.contributorType)}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <ReportGroupDialog groupId={group.id} />
            <Link
              href={`/suggest?paperId=${paperId}&groupId=${group.id}`}
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Suggest Edit
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
