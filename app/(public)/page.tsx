import Link from "next/link";
import { getActiveSemester } from "@/lib/db/semester";
import { PaperTypeGrid } from "@/components/papers/paper-type-grid";
import { MacSearchBar } from "@/components/ui/mac-search-bar";
import { CoursePrefsCard } from "@/components/layout/course-prefs-card";
import { cnSemesterLabel } from "@/lib/constants";

export default async function HomePage() {
  const semester = await getActiveSemester();

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Maharaja Agrasen College
          </p>
          {semester ? (
            <p className="mt-1 inline-flex rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              {cnSemesterLabel(semester.academicYear, semester.semesterNumber)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              No active semester yet.
            </p>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Find your class group in seconds.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Find SEC, VAC, GE, DSE, AEC and Core paper groups for MAC.
        </p>
        <form action="/search" method="get" className="max-w-2xl">
          <MacSearchBar size="hero" />
        </form>
      </section>

      <div className="md:hidden">
        <CoursePrefsCard />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Browse by paper type
        </h2>
        <PaperTypeGrid />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/contribute/add"
          className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-accent/30"
        >
          <p className="font-semibold text-foreground">+ Add group link</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Help classmates find a missing WhatsApp or Telegram group.
          </p>
        </Link>
        <Link
          href="/suggest"
          className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-accent/30"
        >
          <p className="font-semibold text-foreground">Suggest a paper</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell admin if a paper or detail is missing from the catalogue.
          </p>
        </Link>
      </section>
    </div>
  );
}
