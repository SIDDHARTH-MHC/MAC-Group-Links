"use client";

import { useMemo, useState, useTransition } from "react";
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
import { ClassTimeRangeSelect } from "@/components/forms/class-time-range-select";
import { ClassDaysSelect } from "@/components/forms/class-days-select";
import {
  EligibilityAudienceFields,
  buildEligibilitySubmitRows,
  validateEligibilityAudience,
  emptyMultiAudience,
  type AudienceMode,
  type MultiAudienceState,
} from "@/components/forms/eligibility-audience-fields";
import { PAPER_TYPE_LABELS, MAC_PAPER_TYPES } from "@/lib/constants";
import {
  normalizePrefillEndTime,
  normalizePrefillStartTime,
} from "@/lib/constants/class-times";
import { lookupTimetablePrefill } from "@/lib/timetable/prefill";
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

  const validPaperId = papersForType.some((p) => p.id === paperId)
    ? paperId
    : "";
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("single");
  const [multiAudience, setMultiAudience] =
    useState<MultiAudienceState>(emptyMultiAudience);
  const [courseId, setCourseId] = useState("");
  const [year, setYear] = useState("2");
  const [combination, setCombination] = useState("");
  const [groupLink, setGroupLink] = useState("");
  const [platform, setPlatform] = useState<GroupPlatform>("WHATSAPP");
  const initialPrefill = useMemo(() => {
    if (!initialPaper?.paperType || !initialPaper.paperName) return null;
    return lookupTimetablePrefill(
      initialPaper.paperType,
      initialPaper.paperName,
    );
  }, [initialPaper]);

  const [teacherName, setTeacherName] = useState(
    () => initialPrefill?.teacherName ?? "",
  );
  const [actualClassRoom, setActualClassRoom] = useState(
    () => initialPrefill?.actualClassRoom ?? "",
  );
  const [classDays, setClassDays] = useState(() => initialPrefill?.days ?? "");
  const [startTime, setStartTime] = useState(() =>
    normalizePrefillStartTime(initialPrefill?.startTime),
  );
  const [endTime, setEndTime] = useState(() =>
    normalizePrefillEndTime(initialPrefill?.endTime),
  );
  const [timetableHint, setTimetableHint] = useState(() => !!initialPrefill);
  const [sectionName, setSectionName] = useState(
    () => initialPrefill?.sectionName ?? "",
  );
  const [contributorName, setContributorName] = useState("");
  const [contributorType, setContributorType] = useState<ContributorType>(
    "STUDENT"
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function applyTimetablePrefill(paper: { paperName: string } | undefined) {
    if (!paperType || !paper) {
      setTimetableHint(false);
      return;
    }
    const row = lookupTimetablePrefill(paperType, paper.paperName);
    setTimetableHint(!!row);
    if (!row) return;
    setTeacherName(row.teacherName ?? "");
    setActualClassRoom(row.actualClassRoom ?? "");
    setClassDays(row.days ?? "");
    setStartTime(normalizePrefillStartTime(row.startTime));
    setEndTime(normalizePrefillEndTime(row.endTime));
    setSectionName(row.sectionName ?? "");
  }

  function clearScheduleFields() {
    setTeacherName("");
    setActualClassRoom("");
    setClassDays("");
    setStartTime("");
    setEndTime("");
    setSectionName("");
    setTimetableHint(false);
  }


  function submit() {
    if (!paperType) {
      setMessage({ ok: false, text: "Select a paper type (SEC, VAC, etc.)" });
      return;
    }
    if (!validPaperId) {
      setMessage({ ok: false, text: "Select a paper name" });
      return;
    }
    const audErr = validateEligibilityAudience(
      audienceMode,
      { courseId, year, combination },
      multiAudience,
      courses,
      paperType,
    );
    if (audErr) {
      setMessage({ ok: false, text: audErr });
      return;
    }
    const eligibilities = buildEligibilitySubmitRows(
      audienceMode,
      { courseId, year, combination },
      multiAudience,
      courses,
      paperType,
    );

    startTransition(async () => {
      const res = await submitGroupContribution({
        paperId: validPaperId,
        sectionName: sectionName || undefined,
        teacherName: teacherName || undefined,
        actualClassRoom: actualClassRoom || undefined,
        days: classDays || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        groupPlatform: platform,
        groupLink,
        contributorName: contributorName || undefined,
        contributorType,
        appliesToAll: audienceMode === "all",
        eligibilities,
      });
      setMessage({
        ok: res.ok,
        text: res.ok ? res.message : res.error,
      });
    });
  }

  return (
    <div className="w-full space-y-6 overflow-visible rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="space-y-1.5">
        <Label htmlFor="paper-type">Paper type</Label>
        <Select
          value={paperType || undefined}
          onValueChange={(v) => {
            const next = v as PaperType;
            setPaperType(next);
            setPaperId("");
            clearScheduleFields();
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
          value={validPaperId}
          onValueChange={(id) => {
            setPaperId(id);
            setMessage(null);
            applyTimetablePrefill(papersForType.find((p) => p.id === id));
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

      <EligibilityAudienceFields
        courses={courses}
        paperType={paperType}
        mode={audienceMode}
        onModeChange={setAudienceMode}
        courseId={courseId}
        onCourseIdChange={setCourseId}
        year={year}
        onYearChange={setYear}
        combination={combination}
        onCombinationChange={setCombination}
        multi={multiAudience}
        onMultiChange={setMultiAudience}
        heading="Who is this group for?"
      />

      <div className="space-y-1.5">
        <Label>Section (optional)</Label>
        <Input value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
      </div>
      {timetableHint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Teacher, room, and schedule prefilled from the 2026–27 odd-semester timetable.
          Please confirm before submitting.
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label>Teacher (optional)</Label>
        <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Actual class room (optional)</Label>
        <Input
          value={actualClassRoom}
          onChange={(e) => setActualClassRoom(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ClassDaysSelect value={classDays} onChange={setClassDays} />
        <ClassTimeRangeSelect
          startTime={startTime}
          endTime={endTime}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
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
