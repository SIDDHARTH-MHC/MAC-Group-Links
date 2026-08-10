import { getCourses } from "@/lib/actions/public";
import { MyCourseForm } from "@/components/forms/my-course-form";

export default async function MyCoursePage() {
  const courses = await getCourses();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My course</h1>
      <MyCourseForm courses={courses} />
    </div>
  );
}
