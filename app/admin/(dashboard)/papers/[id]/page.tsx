import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { PaperEditClient } from "@/components/admin/paper-edit-client";

type Props = { params: Promise<{ id: string }> };

export default async function AdminPaperEditPage({ params }: Props) {
  const { id } = await params;
  const paper = await prisma.paper.findUnique({
    where: { id },
    include: {
      eligibilities: { include: { course: true } },
      groups: { include: { eligibilities: { include: { course: true } } } },
    },
  });
  if (!paper) notFound();
  return <PaperEditClient paper={paper} />;
}
