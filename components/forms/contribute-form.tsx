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
import { formatCombinationLabel } from "@/lib/courses/mac";
import { isBaProgrammeCourseName } from "@/lib/preferences/course-year";
import { ContributorType, GroupPlatform } from "@prisma/client";
import type { Course } from "@prisma/client";

export function ContributeForm({
  papers,
  courses,
  baCombinations,
  initialPaperId,
}: {
  papers: { id: string; paperName: string; paperType: string }[];
  courses: Course[];
  baCombinations: string[];
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
  const [days, setDays] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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

  const selectedCourse = courses.find((c) => c.id === courseId);
  const showCombination = isBaProgrammeCourseName(selectedCourse?.name);

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
        days: days || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
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
    <div className="space-y-6 rounded-xl border border-border bg-card p-5">
      <div>
        <Label>Paper</Label>
        <Select value={paperId} onValueChange={(v) => setPaperId(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Select paper" />
          </SelectTrigger>
          <SelectContent>
            {papers.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                [{p.paperType}] {p.paperName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Who is this group for?</Label>
        <Select
          value={appliesMode}
          onValueChange={(v) => {
            const mode = v as "mine" | "select" | "multiple" | "all";
            setAppliesMode(mode);
            if (mode === "mine") applyMinePrefs();
          }}
        >
          <SelectTrigger>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Course</Label>
            <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Year</Label>
            <Select value={year} onValueChange={(v) => setYear(v ?? "2")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {showCombination && (appliesMode === "select" || appliesMode === "mine") && (
        <div>
          <Label>Combination (optional)</Label>
          <Select value={combination} onValueChange={(v) => setCombination(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="B.A. Programme combination" />
            </SelectTrigger>
            <SelectContent>
              {baCombinations.map((combo) => (
                <SelectItem key={combo} value={combo}>
                  {formatCombinationLabel(combo)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {appliesMode === "multiple" && (
        <div className="space-y-3">
          {extraEligibilities.map((row, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-2">
              <Select
                value={row.courseId}
                onValueChange={(v) => {
                  const next = [...extraEligibilities];
                  next[idx] = { ...next[idx], courseId: v ?? "" };
                  setExtraEligibilities(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={row.year}
                onValueChange={(v) => {
                  const next = [...extraEligibilities];
                  next[idx] = { ...next[idx], year: v ?? "2" };
                  setExtraEligibilities(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

      <div>
        <Label>Section (optional)</Label>
        <Input value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
      </div>
      <div>
        <Label>Teacher (optional)</Label>
        <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
      </div>
      <div>
        <Label>Actual Class Room (optional)</Label>
        <Input
          value={actualClassRoom}
          onChange={(e) => setActualClassRoom(e.target.value)}
        />
      </div>
      <div>
        <Label>Days (optional)</Label>
        <Input value={days} onChange={(e) => setDays(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Start time (optional)</Label>
          <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Label>End time (optional)</Label>
          <Input value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Platform</Label>
        <Select
          value={platform}
          onValueChange={(v) => setPlatform(v as GroupPlatform)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            <SelectItem value="TELEGRAM">Telegram</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Group link</Label>
        <Input
          value={groupLink}
          onChange={(e) => setGroupLink(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
        />
      </div>

      <div>
        <Label>Your name (optional)</Label>
        <Input
          value={contributorName}
          onChange={(e) => setContributorName(e.target.value)}
        />
      </div>
      <div>
        <Label>You are</Label>
        <Select
          value={contributorType}
          onValueChange={(v) => setContributorType(v as ContributorType)}
        >
          <SelectTrigger>
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
