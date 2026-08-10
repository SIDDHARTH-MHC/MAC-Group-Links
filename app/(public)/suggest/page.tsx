import { Suspense } from "react";
import { getCourses } from "@/lib/actions/public";
import { SuggestForms } from "@/components/forms/suggest-forms";

type Props = {
  searchParams: Promise<{ paperId?: string; groupId?: string; tab?: string }>;
};

export default async function SuggestPage({ searchParams }: Props) {
  const sp = await searchParams;
  const courses = await getCourses();
  const defaultTab = sp.tab === "new" ? "new" : "edit";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Suggest an update
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Lightweight fixes — reviewed by admin before anything changes.
        </p>
      </div>
      <Suspense fallback={null}>
        <SuggestForms
          courses={courses}
          paperId={sp.paperId}
          groupId={sp.groupId}
          defaultTab={defaultTab}
        />
      </Suspense>
    </div>
  );
}
