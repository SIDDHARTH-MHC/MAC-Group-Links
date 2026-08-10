"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
import { PAPER_TYPE_LABELS, MAC_PAPER_TYPES } from "@/lib/constants";
import { ContributorType, GroupPlatform, type PaperType } from "@prisma/client";
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
  const resolvedInitialPaperId = initialPaperId ?? urlPaperId ?? "";
  const initialPaper = resolvedInitialPaperId
    ? papers.find((p) => p.id === resolvedInitialPaperId)
    : undefined;

  const [paperType, setPaperType] = useState<PaperType | "">(
    () => (initialPaper?.paperType as PaperType | undefined) ?? "",
  );
  const [paperId, setPaperId] = useState(resolvedInitialPaperId);

  const papersForType = useMemo(
    () =>
      paperType
        ? papers.filter((p) => p.paperType === paperType)
        : [],
    [papers, paperType],
  );

  useEffect(() => {
    if (!paperId) return;
    if (!papersForType.some((p) => p.id === paperId)) {
      setPaperId("");
    }
  }, [paperId, papersForType]);
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
    if (!paperType) {
      setMessage({ ok: false, text: "Select a paper type (SEC, VAC, etc.)" });
      return;
    }
    if (!paperId) {
      setMessage({ ok: false, text: "Select a paper name" });
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
    <div className="mx-auto max-w-[640px] space-y-6 overflow-visible rounded-xl border border-border bg-card p-5">
      <div className="space-y-1.5">
        <Label htmlFor="paper-type">Paper type</Label>
        <Select
          value={paperType || undefined}
          onValueChange={(v) => {
            const next = v as PaperType;
            setPaperType(next);
            setPaperId("");
            setMessage(null);
          }}
        >
          <SelectTrigger id="paper-type" className="h-11 w-full">
            <SelectValue placeholder="Choose SEC, VAC, GE, DSE, AEC, or Core" />
          </SelectTrigger>
          <SelectContent>
            {MAC_PAPER_TYPES.map((type) => {
              const meta = PAPER_TYPE_LABELS[type];
              const count = papers.filter((p) => p.paperType === type).length;
              return (
                <SelectItem key={type} value={type} disabled={count === 0}>
                  {meta.short} — {meta.title}
                  {count === 0 ? " (none this semester)" : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="paper-combobox">Paper name</Label>
          {paperType ? (
            <span className="text-xs text-muted-foreground">
              {papersForType.length} in catalogue
            </span>
          ) : null}
        </div>
        <PaperCombobox
          id="paper-combobox"
          papers={papersForType}
          value={paperId}
          onValueChange={(id) => {
            setPaperId(id);
            setMessage(null);
          }}
          disabled={!paperType}
          placeholder={
            paperType
              ? "Search and select paper…"
              : "Choose paper type first"
          }
          emptyMessage={
            paperType
              ? "No papers match your search."
              : "Choose a paper type first."
          }
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
