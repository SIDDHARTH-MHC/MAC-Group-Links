import { PaperTypeGrid } from "@/components/papers/paper-type-grid";

export default function PapersHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Browse papers
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose a paper type to see the catalogue and group links for this
          semester.
        </p>
      </div>
      <PaperTypeGrid />
    </div>
  );
}
