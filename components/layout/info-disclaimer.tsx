export function InfoDisclaimer({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      {children}
    </p>
  );
}

export function GroupLinksVerifyDisclaimer() {
  return (
    <InfoDisclaimer>
      Most information here is submitted by students. Please verify group links
      and details before joining. If you spot anything wrong, use the Report
      button on a group or tell someone from the MAC Student Union.
    </InfoDisclaimer>
  );
}

export function ContributeAccuracyDisclaimer() {
  return (
    <InfoDisclaimer>
      Please add correct information only — the right paper, course, year, and
      a working group link. Wrong details can mislead other students.
    </InfoDisclaimer>
  );
}
