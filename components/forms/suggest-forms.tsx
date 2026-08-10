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
import { MAC_PAPER_TYPES, PAPER_TYPE_LABELS } from "@/lib/constants";
import { MacCourseSelect } from "@/components/forms/mac-course-select";

const EDIT_TYPES: { value: SuggestionType; label: string }[] = [
  { value: "PAPER_NAME_WRONG", label: "Paper information is wrong" },
  { value: "WRONG_ELIGIBILITY", label: "Eligibility is wrong" },
  { value: "WRONG_TEACHER", label: "Teacher information is wrong" },
  { value: "WRONG_CLASSROOM", label: "Classroom is wrong" },
  { value: "WRONG_GROUP_LINK", label: "Group link is wrong" },
  { value: "LINK_EXPIRED", label: "Group link expired" },
  { value: "OTHER", label: "Other" },
];

export function SuggestForms({
  courses,
  paperId,
  groupId,
  defaultTab,
}: {
  courses: Course[];
  paperId?: string;
  groupId?: string;
  defaultTab?: "edit" | "new";
}) {
  const initial = defaultTab ?? "edit";
  return (
    <Tabs defaultValue={initial}>
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
  const [type, setType] = useState<SuggestionType | "">("");
  const [description, setDescription] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [paperId] = useState(initialPaperId ?? searchParams.get("paperId") ?? "");
  const [groupId] = useState(initialGroupId ?? searchParams.get("groupId") ?? "");
  const [contributorName, setContributorName] = useState("");
  const [contributorType, setContributorType] = useState<ContributorType>("STUDENT");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<"pick" | "details">("pick");

  if (step === "pick") {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          What needs to be updated?
        </p>
        <ul className="grid gap-2">
          {EDIT_TYPES.map((t) => (
            <li key={t.value}>
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                onClick={() => {
                  setType(t.value);
                  setStep("details");
                }}
              >
                {t.label}
              </Button>
            </li>
          ))}
          <li>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full justify-start py-3 text-left"
              onClick={() => {
                setType("OTHER");
                setStep("details");
              }}
            >
              Paper is missing
            </Button>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => setStep("pick")}
      >
        ← Choose another issue
      </Button>
      <p className="text-sm font-medium text-foreground">
        {EDIT_TYPES.find((t) => t.value === type)?.label ??
          (type === "OTHER" ? "Paper is missing" : "Suggest an update")}
      </p>
      <div>
        <Label htmlFor="suggest-desc">What should we know?</Label>
        <Textarea
          id="suggest-desc"
          className="mt-1.5"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="Briefly describe the correct information…"
        />
      </div>
      <div>
        <Label htmlFor="suggest-value">Suggested fix (optional)</Label>
        <Input
          id="suggest-value"
          className="mt-1.5"
          value={suggestedValue}
          onChange={(e) => setSuggestedValue(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="suggest-name">Your name (optional)</Label>
        <Input
          id="suggest-name"
          className="mt-1.5"
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
          <SelectTrigger className="mt-1.5">
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
            message.toLowerCase().includes("thank")
              ? "text-sm text-emerald-700"
              : "text-sm text-destructive"
          }
        >
          {message}
        </p>
      )}
      <Button
        size="lg"
        className="w-full"
        disabled={pending || !type || !description.trim()}
        onClick={() =>
          startTransition(async () => {
            const res = await submitSuggestion({
              type: type as SuggestionType,
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
        {pending ? "Submitting…" : "Submit suggestion"}
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
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <Label>Paper type</Label>
        <Select value={paperType} onValueChange={(v) => setPaperType(v as PaperType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MAC_PAPER_TYPES.map((t) => (
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
      <MacCourseSelect
        courses={courses}
        courseId={courseId}
        onCourseIdChange={setCourseId}
        year={year}
        onYearChange={setYear}
        hideCombination
        courseLabel="Course (eligibility)"
        yearLabel="Year"
      />
      <div>
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
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
