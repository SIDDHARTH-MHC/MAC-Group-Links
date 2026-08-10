export default function AboutPage() {
  return (
    <div className="mx-auto max-w-prose space-y-6">
      <h1 className="text-2xl font-bold text-foreground">MAC Group Links</h1>
      <p className="text-muted-foreground">
        A student-maintained utility for finding academic group links at
        Maharaja Agrasen College.
      </p>
      <div className="space-y-4 text-sm leading-relaxed text-foreground">
        <p>
          Group links are contributed by students and faculty. Information can
          change during the semester — always confirm with your class or
          teacher if something looks off.
        </p>
        <p>
          You can report incorrect or expired links from any group card, or
          suggest edits when paper details are wrong.
        </p>
        <p>
          The official paper catalogue for each semester is maintained by the
          administrator. Community submissions add group links on top of that
          catalogue.
        </p>
        <p className="text-muted-foreground">
          Department room numbers on paper pages refer to the offering
          department&apos;s room from official lists — not necessarily where
          your class meets. Check each group for the actual class room.
        </p>
      </div>
    </div>
  );
}
