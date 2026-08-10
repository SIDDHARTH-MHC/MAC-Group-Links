import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { listActiveDepartments } from "@/lib/db/departments";
import { PaperEditClient } from "@/components/admin/paper-edit-client";

type Props = { params: Promise<{ id: string }> };

export default async function AdminPaperEditPage({ params }: Props) {
  const { id } = await params;
  const [paper, departments] = await Promise.all([
    prisma.paper.findUnique({
      where: { id },
      include: {
        department: true,
        eligibilities: { include: { course: true } },
        groups: { include: { eligibilities: { include: { course: true } } } },
      },
    }),
    listActiveDepartments(),
  ]);
  if (!paper) notFound();
  return <PaperEditClient paper={paper} departments={departments} />;
}
