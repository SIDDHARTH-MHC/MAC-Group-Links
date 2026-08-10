import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const semester = await prisma.semester.findFirst({
      where: { status: "ACTIVE" },
      select: { id: true, academicYear: true, semesterNumber: true },
    });
    return NextResponse.json({
      ok: true,
      database: "connected",
      activeSemester: semester,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";
    console.error("[health]", error);
    return NextResponse.json(
      { ok: false, database: "error", message },
      { status: 503 },
    );
  }
}
