import { Suspense } from "react";
import { getCourses } from "@/lib/actions/public";
import { SuggestForms } from "@/components/forms/suggest-forms";

type Props = {
  searchParams: Promise<{ paperId?: string; groupId?: string }>;
};

export default async function SuggestPage({ searchParams }: Props) {
  const sp = await searchParams;
  const courses = await getCourses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suggestions</h1>
        <p className="text-sm text-amber-900/70">
          Help keep the catalogue accurate. Changes are reviewed by admin.
        </p>
      </div>
      <Suspense fallback={null}>
        <SuggestForms
          courses={courses}
          paperId={sp.paperId}
          groupId={sp.groupId}
        />
      </Suspense>
    </div>
  );
}
