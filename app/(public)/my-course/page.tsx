import { getCourses } from "@/lib/actions/public";
import { MyCourseForm } from "@/components/forms/my-course-form";
import { MyCourseRelevantGroups } from "@/components/my-course/my-course-relevant";

export default async function MyCoursePage() {
  let courses: Awaited<ReturnType<typeof getCourses>> = [];
  try {
    courses = await getCourses();
  } catch (err) {
    console.error("My Course: failed to load courses", err);
  }
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          My Course
        </h1>
        <p className="mt-2 text-muted-foreground">
          Optional preference saved on this device — no account needed.
        </p>
      </div>
      {courses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Course list is temporarily unavailable. Reload the page in a moment.
        </p>
      ) : (
        <MyCourseForm courses={courses} />
      )}
      <MyCourseRelevantGroups />
    </div>
  );
}
