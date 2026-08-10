import { NextResponse } from "next/server";
import { getActiveSemester } from "@/lib/db/semester";
import { searchPapers } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const semester = await getActiveSemester();
  if (!semester || !q.trim()) {
    return NextResponse.json([]);
  }
  const results = await searchPapers(semester.id, q);
  return NextResponse.json(results);
}
