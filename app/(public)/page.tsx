import Link from "next/link";
import { getActiveSemester } from "@/lib/db/semester";
import { getRecentGroups } from "@/lib/db/queries";
import { PaperTypeGrid } from "@/components/papers/paper-type-grid";
import { GroupCard } from "@/components/groups/group-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cnSemesterLabel } from "@/lib/constants";
import { Search } from "lucide-react";

export default async function HomePage() {
  const semester = await getActiveSemester();
  const recent = semester
    ? await getRecentGroups(semester.id)
    : [];

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm font-medium text-amber-800">Maharaja Agrasen College</p>
        <h1 className="text-3xl font-bold tracking-tight text-amber-950">
          MAC Group Links
        </h1>
        {semester ? (
          <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900">
            {cnSemesterLabel(semester.academicYear, semester.semesterNumber)}
          </p>
        ) : (
          <p className="text-sm text-amber-800">
            No active semester yet. Check back soon.
          </p>
        )}
        <p className="max-w-xl text-amber-900/80">
          Find your SEC, VAC, GE, DSE, AEC &amp; Core class groups easily.
        </p>
        <form action="/search" className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-700/50" />
          <Input
            name="q"
            placeholder="Search papers..."
            className="h-11 border-amber-200 bg-white pl-10"
          />
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Browse by paper type</h2>
        <PaperTypeGrid />
      </section>

      {recent.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Recently added groups</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-100 bg-white/70 p-5">
          <h3 className="font-semibold">Need a group link?</h3>
          <p className="mt-1 text-sm text-amber-900/70">
            Share a WhatsApp or Telegram link with your classmates.
          </p>
          <Button asChild className="mt-4 w-full sm:w-auto">
            <Link href="/contribute">+ Add group link</Link>
          </Button>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white/70 p-5">
          <h3 className="font-semibold">Can&apos;t find your paper?</h3>
          <p className="mt-1 text-sm text-amber-900/70">
            Suggest a missing paper from the official list.
          </p>
          <Button asChild variant="outline" className="mt-4 w-full border-amber-200 sm:w-auto">
            <Link href="/suggest">Suggest a paper</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
