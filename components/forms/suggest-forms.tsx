"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  submitNewPaperSuggestion,
  submitSuggestion,
} from "@/lib/actions/public";
import {
  ContributorType,
  PaperType,
  SuggestionType,
} from "@prisma/client";
import type { Course } from "@prisma/client";
import { PAPER_TYPES, PAPER_TYPE_LABELS } from "@/lib/constants";

const EDIT_TYPES: { value: SuggestionType; label: string }[] = [
  { value: "PAPER_NAME_WRONG", label: "Paper name is wrong" },
  { value: "WRONG_DEPARTMENT", label: "Wrong department" },
  { value: "WRONG_ELIGIBILITY", label: "Wrong eligibility" },
  { value: "MISSING_COURSE_YEAR", label: "Missing course/year" },
  { value: "WRONG_TEACHER", label: "Wrong teacher" },
  { value: "WRONG_SECTION", label: "Wrong section" },
  { value: "WRONG_CLASSROOM", label: "Wrong classroom" },
  { value: "WRONG_GROUP_LINK", label: "Wrong group link" },
  { value: "LINK_EXPIRED", label: "Group link expired" },
  { value: "OTHER", label: "Other" },
];

export function SuggestForms({
  courses,
  paperId,
  groupId,
}: {
  courses: Course[];
  paperId?: string;
  groupId?: string;
}) {
  return (
    <Tabs defaultValue={paperId ? "edit" : "new"}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit">Suggest an edit</TabsTrigger>
        <TabsTrigger value="new">Suggest new paper</TabsTrigger>
      </TabsList>
      <TabsContent value="edit">
        <EditSuggestionForm
          courses={courses}
          initialPaperId={paperId}
          initialGroupId={groupId}
        />
      </TabsContent>
      <TabsContent value="new">
        <NewPaperSuggestionForm courses={courses} />
      </TabsContent>
    </Tabs>
  );
}

function EditSuggestionForm({
  initialPaperId,
  initialGroupId,
}: {
  courses: Course[];
  initialPaperId?: string;
  initialGroupId?: string;
}) {
  const searchParams = useSearchParams();
  const [type, setType] = useState<SuggestionType>("OTHER");
  const [description, setDescription] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [paperId] = useState(initialPaperId ?? searchParams.get("paperId") ?? "");
  const [groupId] = useState(initialGroupId ?? searchParams.get("groupId") ?? "");
  const [contributorName, setContributorName] = useState("");
  const [contributorType, setContributorType] = useState<ContributorType>("STUDENT");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4 rounded-xl border border-amber-100 bg-white p-5">
      <div>
        <Label>Suggestion type</Label>
        <Select value={type} onValueChange={(v) => setType(v as SuggestionType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDIT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <Label>Suggested value (optional)</Label>
        <Input
          value={suggestedValue}
          onChange={(e) => setSuggestedValue(e.target.value)}
        />
      </div>
      <div>
        <Label>Your name (optional)</Label>
        <Input value={contributorName} onChange={(e) => setContributorName(e.target.value)} />
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
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await submitSuggestion({
              type,
              description,
              suggestedValue: suggestedValue || undefined,
              paperId: paperId || undefined,
              groupId: groupId || undefined,
              contributorName: contributorName || undefined,
              contributorType,
            });
            setMessage(res.ok ? res.message : res.error);
          })
        }
      >
        Submit suggestion
      </Button>
    </div>
  );
}

function NewPaperSuggestionForm({ courses }: { courses: Course[] }) {
  const [paperType, setPaperType] = useState<PaperType>("SEC");
  const [paperName, setPaperName] = useState("");
  const [suggestedDepartmentName, setSuggestedDepartmentName] = useState("");
  const [suggestedDepartmentRoom, setSuggestedDepartmentRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [courseId, setCourseId] = useState("");
  const [year, setYear] = useState("1");
  const [contributorName, setContributorName] = useState("");
  const [contributorType, setContributorType] = useState<ContributorType>("STUDENT");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4 rounded-xl border border-amber-100 bg-white p-5">
      <div>
        <Label>Paper type</Label>
        <Select value={paperType} onValueChange={(v) => setPaperType(v as PaperType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAPER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {PAPER_TYPE_LABELS[t].short}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Paper name</Label>
        <Input value={paperName} onChange={(e) => setPaperName(e.target.value)} />
      </div>
      <div>
        <Label>Offering department</Label>
        <Input
          value={suggestedDepartmentName}
          onChange={(e) => setSuggestedDepartmentName(e.target.value)}
        />
      </div>
      <div>
        <Label>Department room</Label>
        <Input
          value={suggestedDepartmentRoom}
          onChange={(e) => setSuggestedDepartmentRoom(e.target.value)}
        />
      </div>
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
              <SelectItem value="1">1st</SelectItem>
              <SelectItem value="2">2nd</SelectItem>
              <SelectItem value="3">3rd</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div>
        <Label>Your name</Label>
        <Input value={contributorName} onChange={(e) => setContributorName(e.target.value)} />
      </div>
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await submitNewPaperSuggestion({
              paperType,
              paperName,
              suggestedDepartmentName,
              suggestedDepartmentRoom: suggestedDepartmentRoom || undefined,
              notes,
              contributorName: contributorName || undefined,
              contributorType,
              eligibilities: courseId
                ? [{ courseId, year: Number(year) }]
                : [],
            });
            setMessage(res.ok ? res.message : res.error);
          })
        }
      >
        Submit
      </Button>
    </div>
  );
}
