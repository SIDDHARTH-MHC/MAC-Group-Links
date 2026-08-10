"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  formatEligibility,
  PLATFORM_LABELS,
} from "@/lib/constants";
import { useCourseYearPrefs, matchesEligibility } from "@/lib/preferences/course-year";
import type {
  Group,
  GroupEligibility,
  Course,
  GroupPlatform,
} from "@prisma/client";
import { ReportGroupDialog } from "@/components/groups/report-group-dialog";

export type GroupRow = Group & {
  eligibilities: (GroupEligibility & { course: Course | null })[];
};

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
          matchesEligibility(e.appliesToAll, e.courseId, e.year, prefs)
        );
      })
    : groups;

  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-amber-200 bg-white/50 p-8 text-center">
        <p className="text-amber-900/80">No group link has been added yet.</p>
        <p className="mt-1 text-sm text-amber-800/60">Be the first to contribute.</p>
        <Button asChild className="mt-4">
          <Link href={`/contribute?paperId=${paperId}`}>+ Add group link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prefs && (
        <p className="text-sm text-amber-800">
          Showing groups relevant to{" "}
          <strong>
            {prefs.courseName} — {prefs.year === 1 ? "1st" : prefs.year === 2 ? "2nd" : "3rd"} Year
          </strong>
          .{" "}
          <Link href="/my-course" className="underline">
            Change
          </Link>
        </p>
      )}
      {visible.map((group) => (
        <article
          key={group.id}
          className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold">{group.sectionName}</h3>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <span className="text-amber-900/60">For: </span>
              {group.eligibilities.length
                ? group.eligibilities.map((e) =>
                    formatEligibility(
                      e.appliesToAll,
                      e.course?.name,
                      e.year,
                      e.combination
                    )
                  ).join(" · ")
                : "All students taking this paper"}
            </li>
            {group.teacherName && (
              <li>
                <span className="text-amber-900/60">Teacher: </span>
                {group.teacherName}
              </li>
            )}
            {group.actualClassRoom && (
              <li>
                <span className="text-amber-900/60">Class room: </span>
                {group.actualClassRoom}
              </li>
            )}
            {group.days && (
              <li>
                <span className="text-amber-900/60">Days: </span>
                {group.days}
              </li>
            )}
            {(group.startTime || group.endTime) && (
              <li>
                <span className="text-amber-900/60">Time: </span>
                {[group.startTime, group.endTime && `– ${group.endTime}`]
                  .filter(Boolean)
                  .join(" ")}
              </li>
            )}
            {group.contributorType && (
              <li className="text-xs text-amber-800/60">
                {group.contributorType === "PROFESSOR"
                  ? "Added by professor"
                  : "Community contribution"}
              </li>
            )}
          </ul>
          {group.groupLink ? (
            <Button
              asChild
              className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto"
            >
              <a
                href={group.groupLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Join {PLATFORM_LABELS[group.groupPlatform as GroupPlatform]} group
              </a>
            </Button>
          ) : (
            <p className="mt-4 text-sm italic text-amber-800/60">Link not available</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link
              href={`/suggest?paperId=${paperId}&groupId=${group.id}`}
              className="text-amber-800 underline"
            >
              Suggest an edit
            </Link>
            <ReportGroupDialog groupId={group.id} />
          </div>
        </article>
      ))}
    </div>
  );
}
