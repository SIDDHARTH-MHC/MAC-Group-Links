-- Site-wide toggles (auto-approve contributions, etc.)
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "autoApproveContributions" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteSettings" ("id", "autoApproveContributions", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP);
