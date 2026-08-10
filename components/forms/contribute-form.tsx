"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitGroupContribution } from "@/lib/actions/public";
import { PaperCombobox } from "@/components/forms/paper-combobox";
import {
  MacCourseSelect,
  MacCourseYearRow,
} from "@/components/forms/mac-course-select";
import { ContributorType, GroupPlatform } from "@prisma/client";
import type { Course } from "@prisma/client";

export function ContributeForm({
  papers,
  courses,
  initialPaperId,
}: {
  papers: { id: string; paperName: string; paperType: string }[];
  courses: Course[];
  initialPaperId?: string;
}) {
  const searchParams = useSearchParams();
  const urlPaperId = searchParams.get("paperId");
  const [paperId, setPaperId] = useState(initialPaperId ?? urlPaperId ?? "");
  const [appliesMode, setAppliesMode] = useState<
    "mine" | "select" | "multiple" | "all"
  >("mine");
  const [courseId, setCourseId] = useState("");
  const [year, setYear] = useState("2");
  const [combination, setCombination] = useState("");
  const [extraEligibilities, setExtraEligibilities] = useState<
    { courseId: string; year: string }[]
  >([{ courseId: "", year: "2" }]);
  const [groupLink, setGroupLink] = useState("");
  const [platform, setPlatform] = useState<GroupPlatform>("WHATSAPP");
  const [teacherName, setTeacherName] = useState("");
  const [actualClassRoom, setActualClassRoom] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [contributorType, setContributorType] = useState<ContributorType>(
    "STUDENT"
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function applyMinePrefs() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("mac-group-links-prefs");
      if (!raw) return;
      const prefs = JSON.parse(raw) as {
        courseId: string;
        year: number;
        combination?: string | null;
      };
      setCourseId(prefs.courseId);
      setYear(String(prefs.year));
      if (prefs.combination) setCombination(prefs.combination);
    } catch {
      /* ignore */
    }
  }

  function submit() {
    if (!paperId) {
      setMessage({ ok: false, text: "Select a paper" });
      return;
    }
    const eligibilities =
      appliesMode === "all"
        ? [{ appliesToAll: true }]
        : appliesMode === "multiple"
          ? extraEligibilities
              .filter((e) => e.courseId)
              .map((e) => ({
                courseId: e.courseId,
                year: Number(e.year),
              }))
          : [
              {
                courseId: courseId || undefined,
                year: Number(year),
                combination: combination || undefined,
              },
            ];

    if (
      appliesMode === "multiple" &&
      eligibilities.length === 0
    ) {
      setMessage({ ok: false, text: "Select at least one course and year" });
      return;
    }
    startTransition(async () => {
      const res = await submitGroupContribution({
        paperId,
        sectionName: sectionName || undefined,
        teacherName: teacherName || undefined,
        actualClassRoom: actualClassRoom || undefined,
        groupPlatform: platform,
        groupLink,
        contributorName: contributorName || undefined,
        contributorType,
        appliesToAll: appliesMode === "all",
        eligibilities,
      });
      setMessage({
        ok: res.ok,
        text: res.ok ? res.message : res.error,
      });
    });
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-6 rounded-xl border border-border bg-card p-5">
      <div className="space-y-1.5">
        <Label htmlFor="paper-combobox">Paper</Label>
        <PaperCombobox
          id="paper-combobox"
          papers={papers}
          value={paperId}
          onValueChange={setPaperId}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Who is this group for?</Label>
        <Select
          value={appliesMode}
          onValueChange={(v) => {
            const mode = v as "mine" | "select" | "multiple" | "all";
            setAppliesMode(mode);
            if (mode === "mine") applyMinePrefs();
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mine">My course &amp; year</SelectItem>
            <SelectItem value="select">Select course/year</SelectItem>
            <SelectItem value="multiple">Multiple courses/years</SelectItem>
            <SelectItem value="all">Everyone taking this paper</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {appliesMode === "mine" && !courseId ? (
        <Button type="button" variant="secondary" size="sm" onClick={applyMinePrefs}>
          Load from My Course
        </Button>
      ) : null}

      {(appliesMode === "select" || appliesMode === "mine") && (
        <MacCourseSelect
          courses={courses}
          courseId={courseId}
          onCourseIdChange={setCourseId}
          year={year}
          onYearChange={setYear}
          combination={combination}
          onCombinationChange={setCombination}
          combinationLabel="Combination"
          combinationOptional
        />
      )}

      {appliesMode === "multiple" && (
        <div className="space-y-3">
          {extraEligibilities.map((row, idx) => (
            <MacCourseYearRow
              key={idx}
              courses={courses}
              courseId={row.courseId}
              onCourseIdChange={(v) => {
                const next = [...extraEligibilities];
                next[idx] = { ...next[idx], courseId: v };
                setExtraEligibilities(next);
              }}
              year={row.year}
              onYearChange={(v) => {
                const next = [...extraEligibilities];
                next[idx] = { ...next[idx], year: v };
                setExtraEligibilities(next);
              }}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setExtraEligibilities([
                ...extraEligibilities,
                { courseId: "", year: "2" },
              ])
            }
          >
            + Add another course/year
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Section (optional)</Label>
        <Input value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Teacher (optional)</Label>
        <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Actual Class Room (optional)</Label>
        <Input
          value={actualClassRoom}
          onChange={(e) => setActualClassRoom(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Platform</Label>
        <Select
          value={platform}
          onValueChange={(v) => setPlatform(v as GroupPlatform)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            <SelectItem value="TELEGRAM">Telegram</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Group link</Label>
        <Input
          value={groupLink}
          onChange={(e) => setGroupLink(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
        />
      </div>

      <div className="space-y-1.5">
        <Label>Your name (optional)</Label>
        <Input
          value={contributorName}
          onChange={(e) => setContributorName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>You are</Label>
        <Select
          value={contributorType}
          onValueChange={(v) => setContributorType(v as ContributorType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STUDENT">Student</SelectItem>
            <SelectItem value="PROFESSOR">Professor</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {message && (
        <p
          className={
            message.ok ? "text-sm text-emerald-800" : "text-sm text-red-700"
          }
        >
          {message.text}
        </p>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={pending}
        onClick={submit}
      >
        {pending ? "Submitting…" : "Submit group link"}
      </Button>
    </div>
  );
}
