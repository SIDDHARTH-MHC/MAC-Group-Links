import { prisma } from "@/lib/db/prisma";

const SETTINGS_ID = "default";

export async function getSiteSettings() {
  return prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, autoApproveContributions: false },
    update: {},
  });
}

export async function getAutoApproveContributions(): Promise<boolean> {
  const settings = await getSiteSettings();
  return settings.autoApproveContributions;
}

export async function setAutoApproveContributions(
  enabled: boolean,
): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, autoApproveContributions: enabled },
    update: { autoApproveContributions: enabled },
  });
}
