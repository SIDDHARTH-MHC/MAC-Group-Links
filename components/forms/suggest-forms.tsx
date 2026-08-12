"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { FilePlus, PencilLine } from "lucide-react";
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
import {
  submitNewPaperSuggestion,
  submitSuggestion,
} from "@/lib/actions/public";
import { PaperCombobox, type PaperOption } from "@/components/forms/paper-combobox";
import {
  EligibilityAudienceFields,
  buildEligibilitySubmitRows,
  validateEligibilityAudience,
  emptyMultiAudience,
  type AudienceMode,
  type MultiAudienceState,
} from "@/components/forms/eligibility-audience-fields";
import { SuggestionSuccess } from "@/components/forms/suggestion-success";
import { MAC_PAPER_TYPES, PAPER_TYPE_LABELS, formatEligibility, isValidGroupUrl } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PaperType, SuggestionType, GroupPlatform } from "@prisma/client";
import type { Course } from "@prisma/client";

type SuggestMode = "edit" | "new";

type EditIssue =
  | "paper_name"
  | "department"
  | "department_room"
  | "eligibility"
  | "other";

const EDIT_ISSUES: { value: EditIssue; label: string }[] = [
  { value: "paper_name", label: "Paper name" },
  { value: "department", label: "Offering department" },
  { value: "department_room", label: "Department room" },
  { value: "eligibility", label: "Eligibility" },
  { value: "other", label: "Other" },
];

function mapEditIssueToType(issue: EditIssue): SuggestionType {
  switch (issue) {
    case "paper_name":
      return SuggestionType.PAPER_NAME_WRONG;
    case "department":
      return SuggestionType.WRONG_DEPARTMENT;
    case "department_room":
      return SuggestionType.OTHER;
    case "eligibility":
      return SuggestionType.WRONG_ELIGIBILITY;
    default:
      return SuggestionType.OTHER;
  }
}

function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function SuggestForms({
  courses,
  papers,
  departments,
  paperId: initialPaperId,
  groupId: initialGroupId,
  defaultMode,
}: {
  courses: Course[];
  papers: PaperOption[];
  departments: string[];
  paperId?: string;
  groupId?: string;
  defaultMode?: SuggestMode;
}) {
  const searchParams = useSearchParams();
  const urlPaperId = searchParams.get("paperId") ?? undefined;
  const urlGroupId = searchParams.get("groupId") ?? undefined;
  const urlTab = searchParams.get("tab");

  const [mode, setMode] = useState<SuggestMode>(() => {
    if (defaultMode) return defaultMode;
    if (urlTab === "new") return "new";
    return "edit";
  });
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <SuggestionSuccess
        onSuggestAnother={() => {
          setSuccess(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ModeButton
          active={mode === "edit"}
          icon={PencilLine}
          title="Suggest an edit"
          description="Correct something wrong in the catalogue."
          onClick={() => setMode("edit")}
        />
        <ModeButton
          active={mode === "new"}
          icon={FilePlus}
          title="Suggest a new paper"
          description="Tell us about a paper that is missing."
          onClick={() => setMode("new")}
        />
      </div>

      {mode === "edit" ? (
        <EditSuggestionForm
          courses={courses}
          papers={papers}
          initialPaperId={initialPaperId ?? urlPaperId}
          initialGroupId={initialGroupId ?? urlGroupId}
          onSuccess={() => setSuccess(true)}
        />
      ) : (
        <NewPaperSuggestionForm
          courses={courses}
          departments={departments}
          onSuccess={() => setSuccess(true)}
        />
      )}
    </div>
  );
}

function ModeButton({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof PencilLine;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-primary bg-accent/40 shadow-sm"
          : "border-border bg-card hover:border-primary/30 hover:bg-accent/20",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function EditSuggestionForm({
  courses,
  papers,
  initialPaperId,
  initialGroupId,
  onSuccess,
}: {
  courses: Course[];
  papers: PaperOption[];
  initialPaperId?: string;
  initialGroupId?: string;
  onSuccess: () => void;
}) {
  const [paperId, setPaperId] = useState(initialPaperId ?? "");
  const [issue, setIssue] = useState<EditIssue | "">("");
  const [correctionName, setCorrectionName] = useState("");
  const [correctionDepartment, setCorrectionDepartment] = useState("");
  const [correctionRoom, setCorrectionRoom] = useState("");
  const [courseId, setCourseId] = useState("");
  const [year, setYear] = useState("2");
  const [combination, setCombination] = useState("");
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("all");
  const [multiAudience, setMultiAudience] =
    useState<MultiAudienceState>(emptyMultiAudience);
  const [suggestedCorrection, setSuggestedCorrection] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editPaperType =
    papers.find((p) => p.id === paperId)?.paperType ?? "SEC";

  function eligibilitySummary(): string {
    const rows = buildEligibilitySubmitRows(
      audienceMode,
      { courseId, year, combination },
      multiAudience,
      courses,
      editPaperType,
    );
    if (rows[0]?.appliesToAll) {
      return "All students taking this paper";
    }
    return rows
      .map((r) => {
        const course = courses.find((c) => c.id === r.courseId);
        return formatEligibility(
          false,
          course?.name,
          r.year ?? null,
          r.combination,
        );
      })
      .join("; ");
  }

  function validate(): boolean {
    if (!paperId) {
      setFieldError("Please select a paper.");
      return false;
    }
    if (!issue) {
      setFieldError("Please select what needs to be corrected.");
      return false;
    }
    if (issue === "paper_name" && !correctionName.trim()) {
      setFieldError("Please enter the correct paper name.");
      return false;
    }
    if (issue === "department" && !correctionDepartment.trim()) {
      setFieldError("Please enter the correct offering department.");
      return false;
    }
    if (issue === "department_room" && !correctionRoom.trim()) {
      setFieldError("Please enter the correct department room.");
      return false;
    }
    if (issue === "eligibility") {
      const audErr = validateEligibilityAudience(
        audienceMode,
        { courseId, year, combination },
        multiAudience,
        courses,
        editPaperType,
      );
      if (audErr) {
        setFieldError(audErr);
        return false;
      }
    }
    if (!suggestedCorrection.trim() && !additionalInfo.trim()) {
      setFieldError(
        "Please describe the correction or add additional information.",
      );
      return false;
    }
    setFieldError(null);
    return true;
  }

  function buildPayload(): {
    type: SuggestionType;
    description: string;
    suggestedValue?: string;
  } {
    const parts: string[] = [];
    let suggestedValue: string | undefined;

    if (issue === "paper_name") {
      suggestedValue = correctionName.trim();
      parts.push(`Correct paper name: ${correctionName.trim()}`);
    } else if (issue === "department") {
      suggestedValue = correctionDepartment.trim();
      parts.push(`Correct offering department: ${correctionDepartment.trim()}`);
    } else if (issue === "department_room") {
      suggestedValue = correctionRoom.trim();
      parts.push(`Correct department room: ${correctionRoom.trim()}`);
    } else if (issue === "eligibility") {
      suggestedValue = eligibilitySummary();
      parts.push(`Correct eligibility: ${suggestedValue}`);
    }

    if (suggestedCorrection.trim()) {
      parts.push(`Suggested correction: ${suggestedCorrection.trim()}`);
    }
    if (additionalInfo.trim()) {
      parts.push(additionalInfo.trim());
    }

    return {
      type: mapEditIssueToType(issue as EditIssue),
      description: parts.join("\n\n"),
      suggestedValue,
    };
  }

  return (
    <FormCard title="Suggest an edit">
      <div className="space-y-1.5">
        <Label htmlFor="edit-paper">Select the paper</Label>
        <PaperCombobox
          id="edit-paper"
          papers={papers}
          value={paperId}
          onValueChange={(id) => {
            setPaperId(id);
            setFieldError(null);
          }}
          placeholder="Search and select a paper…"
          emptyMessage="No papers match your search."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-issue">What needs to be corrected?</Label>
        <Select
          value={issue || undefined}
          onValueChange={(v) => {
            setIssue(v as EditIssue);
            setFieldError(null);
          }}
        >
          <SelectTrigger id="edit-issue" className="w-full">
            <SelectValue placeholder="Select an issue" />
          </SelectTrigger>
          <SelectContent>
            {EDIT_ISSUES.map((row) => (
              <SelectItem key={row.value} value={row.value}>
                {row.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {issue === "paper_name" ? (
        <div className="space-y-1.5">
          <Label htmlFor="corr-name">Correct paper name</Label>
          <Input
            id="corr-name"
            value={correctionName}
            onChange={(e) => setCorrectionName(e.target.value)}
            placeholder="Enter the correct name"
          />
        </div>
      ) : null}

      {issue === "department" ? (
        <div className="space-y-1.5">
          <Label htmlFor="corr-dept">Correct offering department</Label>
          <Input
            id="corr-dept"
            value={correctionDepartment}
            onChange={(e) => setCorrectionDepartment(e.target.value)}
            placeholder="Department name"
          />
        </div>
      ) : null}

      {issue === "department_room" ? (
        <div className="space-y-1.5">
          <Label htmlFor="corr-room">Correct department room</Label>
          <Input
            id="corr-room"
            value={correctionRoom}
            onChange={(e) => setCorrectionRoom(e.target.value)}
            placeholder="Room number or location"
          />
        </div>
      ) : null}

      {issue === "eligibility" ? (
        <EligibilityAudienceFields
          courses={courses}
          paperType={editPaperType}
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
          heading="Who should be eligible?"
        />
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="suggested-correction">Suggested correction</Label>
        <Textarea
          id="suggested-correction"
          value={suggestedCorrection}
          onChange={(e) => setSuggestedCorrection(e.target.value)}
          placeholder="What should we change it to?"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="additional-info">Additional information (optional)</Label>
        <Textarea
          id="additional-info"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Anything else that helps admin review this…"
          rows={3}
        />
      </div>

      <FieldError message={fieldError ?? submitError} />

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() => {
          if (!validate()) return;
          const payload = buildPayload();
          startTransition(async () => {
            const res = await submitSuggestion({
              type: payload.type,
              description: payload.description,
              suggestedValue: payload.suggestedValue,
              paperId,
              groupId: initialGroupId || undefined,
            });
            if (res.ok) {
              onSuccess();
            } else {
              setSubmitError(res.error);
            }
          });
        }}
      >
        {pending ? "Submitting…" : "Submit suggestion"}
      </Button>
    </FormCard>
  );
}

function NewPaperSuggestionForm({
  courses,
  departments,
  onSuccess,
}: {
  courses: Course[];
  departments: string[];
  onSuccess: () => void;
}) {
  const [paperType, setPaperType] = useState<PaperType>("SEC");
  const [paperName, setPaperName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [departmentRoom, setDepartmentRoom] = useState("");
  const [courseId, setCourseId] = useState("");
  const [year, setYear] = useState("2");
  const [combination, setCombination] = useState("");
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("all");
  const [multiAudience, setMultiAudience] =
    useState<MultiAudienceState>(emptyMultiAudience);
  const [notes, setNotes] = useState("");
  const [groupLink, setGroupLink] = useState("");
  const [groupPlatform, setGroupPlatform] = useState<GroupPlatform>("WHATSAPP");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sortedDepartments = useMemo(
    () => [...departments].sort((a, b) => a.localeCompare(b)),
    [departments],
  );

  function validate(): boolean {
    if (!paperName.trim()) {
      setFieldError("Please enter the paper name.");
      return false;
    }
    if (!departmentName) {
      setFieldError("Please select the offering department.");
      return false;
    }
    const audErr = validateEligibilityAudience(
      audienceMode,
      { courseId, year, combination },
      multiAudience,
      courses,
      paperType,
    );
    if (audErr) {
      setFieldError(audErr);
      return false;
    }
    if (groupLink.trim() && !isValidGroupUrl(groupLink)) {
      setFieldError("Enter a valid group link URL (https://...).");
      return false;
    }
    setFieldError(null);
    return true;
  }

  return (
    <FormCard title="Suggest a new paper">
      <div className="space-y-1.5">
        <Label htmlFor="new-type">Paper type</Label>
        <Select
          value={paperType}
          onValueChange={(v) => setPaperType(v as PaperType)}
        >
          <SelectTrigger id="new-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MAC_PAPER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {PAPER_TYPE_LABELS[t].short} — {PAPER_TYPE_LABELS[t].title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-name">Paper name</Label>
        <Input
          id="new-name"
          value={paperName}
          onChange={(e) => setPaperName(e.target.value)}
          placeholder="Enter paper name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-dept">Offering department</Label>
        <Select
          value={departmentName || undefined}
          onValueChange={(v) => setDepartmentName(v ?? "")}
        >
          <SelectTrigger id="new-dept" className="w-full">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {sortedDepartments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-room">
          Department room <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="new-room"
          value={departmentRoom}
          onChange={(e) => setDepartmentRoom(e.target.value)}
          placeholder="Room number or location"
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
        heading="Who is this paper for?"
      />

      <div className="space-y-1.5">
        <Label htmlFor="new-notes">
          Notes <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="new-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tell us anything useful about this paper"
          rows={4}
        />
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">
          Group link{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="new-platform">Platform</Label>
          <Select
            value={groupPlatform}
            onValueChange={(v) => setGroupPlatform(v as GroupPlatform)}
          >
            <SelectTrigger id="new-platform" className="w-full">
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
          <Label htmlFor="new-group-link">Group link</Label>
          <Input
            id="new-group-link"
            value={groupLink}
            onChange={(e) => setGroupLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
          />
        </div>
      </div>

      <FieldError message={fieldError ?? submitError} />

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() => {
          if (!validate()) return;
          startTransition(async () => {
            const eligibilities = buildEligibilitySubmitRows(
              audienceMode,
              { courseId, year, combination },
              multiAudience,
              courses,
              paperType,
            );
            const res = await submitNewPaperSuggestion({
              paperType,
              paperName: paperName.trim(),
              suggestedDepartmentName: departmentName,
              suggestedDepartmentRoom: departmentRoom.trim() || undefined,
              notes: notes.trim() || undefined,
              groupPlatform: groupLink.trim() ? groupPlatform : undefined,
              groupLink: groupLink.trim() || undefined,
              eligibilities,
            });
            if (res.ok) {
              onSuccess();
            } else {
              setSubmitError(res.error);
            }
          });
        }}
      >
        {pending ? "Submitting…" : "Submit suggestion"}
      </Button>
    </FormCard>
  );
}
