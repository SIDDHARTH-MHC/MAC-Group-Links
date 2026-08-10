import { getCourses } from "@/lib/actions/public";
import { MyCourseForm } from "@/components/forms/my-course-form";
import { MyCourseRelevantGroups } from "@/components/my-course/my-course-relevant";

export default async function MyCoursePage() {
  const courses = await getCourses();
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
      <MyCourseForm courses={courses} />
      <MyCourseRelevantGroups />
    </div>
  );
}
