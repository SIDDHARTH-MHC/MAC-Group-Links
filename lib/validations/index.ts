import { z } from "zod";
import {
  ContributorType,
  GroupPlatform,
  PaperType,
  ReportReason,
  SuggestionType,
} from "@prisma/client";
import { isValidGroupUrl } from "@/lib/constants";

export const groupLinkSchema = z
  .string()
  .min(1, "Group link is required")
  .refine(isValidGroupUrl, "Enter a valid URL (https://...)");

export const eligibilityRowSchema = z.object({
  courseId: z.string().optional(),
  year: z.coerce.number().int().min(1).max(4).optional(),
  combination: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional(),
  appliesToAll: z.boolean().optional(),
});

export const importEligibilitySchema = z.object({
  course: z.string().min(1).optional(),
  year: z.coerce.number().int().min(1).max(4).optional(),
  combination: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional(),
  appliesToAll: z.boolean().optional(),
});

export const groupContributionSchema = z.object({
  paperId: z.string().min(1),
  sectionName: z.string().max(100).optional(),
  teacherName: z.string().max(200).optional(),
  actualClassRoom: z.string().max(100).optional(),
  days: z.string().max(200).optional(),
  startTime: z.string().max(50).optional(),
  endTime: z.string().max(50).optional(),
  groupPlatform: z.nativeEnum(GroupPlatform),
  groupLink: groupLinkSchema,
  contributorName: z.string().max(200).optional(),
  contributorType: z.nativeEnum(ContributorType).optional(),
  appliesToAll: z.boolean().default(false),
  eligibilities: z.array(eligibilityRowSchema).default([]),
});

export const suggestionSchema = z.object({
  type: z.nativeEnum(SuggestionType),
  description: z.string().min(3).max(2000),
  suggestedValue: z.string().max(2000).optional(),
  paperId: z.string().optional(),
  groupId: z.string().optional(),
  contributorName: z.string().max(200).optional(),
  contributorType: z.nativeEnum(ContributorType).optional(),
});

export const newPaperSuggestionSchema = z.object({
  paperType: z.nativeEnum(PaperType),
  paperName: z.string().min(2).max(300),
  suggestedDepartmentName: z.string().min(1).max(200),
  suggestedDepartmentRoom: z.string().max(100).optional(),
  sourceDocumentUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
  contributorName: z.string().max(200).optional(),
  contributorType: z.nativeEnum(ContributorType).optional(),
  eligibilities: z.array(eligibilityRowSchema).default([]),
});

export const groupReportSchema = z.object({
  groupId: z.string().min(1),
  reason: z.nativeEnum(ReportReason),
  description: z.string().max(2000).optional(),
  reporterName: z.string().max(200).optional(),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const paperFormSchema = z.object({
  semesterId: z.string().min(1),
  paperType: z.nativeEnum(PaperType),
  paperName: z.string().min(2).max(300),
  paperCode: z.string().max(50).optional(),
  departmentId: z.string().min(1),
  description: z.string().max(2000).optional(),
  sourceDocumentUrl: z.string().url().optional().or(z.literal("")),
  eligibilityNotes: z.string().max(2000).optional(),
  eligibilities: z.array(eligibilityRowSchema).default([]),
});

export const groupFormSchema = z.object({
  paperId: z.string().min(1),
  sectionName: z.string().min(1).max(100),
  teacherName: z.string().max(200).optional(),
  actualClassRoom: z.string().max(100).optional(),
  days: z.string().max(200).optional(),
  startTime: z.string().max(50).optional(),
  endTime: z.string().max(50).optional(),
  groupPlatform: z.nativeEnum(GroupPlatform),
  groupLink: z
    .string()
    .optional()
    .refine((v) => !v || isValidGroupUrl(v), "Invalid URL"),
  contributorName: z.string().max(200).optional(),
  contributorType: z.nativeEnum(ContributorType).optional(),
  appliesToAll: z.boolean().default(false),
  eligibilities: z.array(eligibilityRowSchema).default([]),
});

export const semesterFormSchema = z.object({
  academicYear: z.string().regex(/^\d{4}-\d{2}$/, "Use format like 2026-27"),
  semesterNumber: z.coerce.number().int().min(1).max(8),
});

export const paperImportRowSchema = z.object({
  paperType: z.nativeEnum(PaperType),
  paperName: z.string().min(2),
  department: z.string().min(1),
  departmentRoom: z.string().optional().nullable(),
  paperCode: z.string().optional(),
  dseNumber: z.string().optional().nullable(),
  seatCapacity: z.coerce.number().int().positive().optional().nullable(),
  prerequisite: z.string().optional().nullable(),
  sourceDocument: z.string().optional().nullable(),
  sourcePage: z.coerce.number().int().optional().nullable(),
  sourceText: z.string().optional().nullable(),
  sourceDocumentUrl: z.string().optional(),
  eligibilityNotes: z.string().max(2000).optional().nullable(),
  eligibilities: z.array(importEligibilitySchema).default([]),
});

export const paperImportSchema = z.array(paperImportRowSchema);

export const officialCatalogueImportSchema = z.array(
  paperImportRowSchema.extend({
    semesterNumber: z.coerce.number().int().min(1).max(8),
    needsReview: z.boolean().optional(),
    reviewNote: z.string().optional().nullable(),
  }),
);
