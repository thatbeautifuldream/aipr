import { AppError } from "./errors.js";
import type { PrDraft } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractFencedJson(raw: string): string | undefined {
  const match = raw.match(/```json\s*([\s\S]*?)```/i);
  return match?.[1]?.trim();
}

function findDraftInValue(value: unknown): PrDraft | undefined {
  if (isRecord(value)) {
    const title = value.title;
    const body = value.body;

    if (typeof title === "string" && typeof body === "string") {
      return {
        title: title.trim(),
        body: body.trim(),
      };
    }

    for (const nestedValue of Object.values(value)) {
      const nestedDraft = findDraftInValue(nestedValue);
      if (nestedDraft) {
        return nestedDraft;
      }
    }
  }

  if (Array.isArray(value)) {
    for (const nestedValue of value) {
      const nestedDraft = findDraftInValue(nestedValue);
      if (nestedDraft) {
        return nestedDraft;
      }
    }
  }

  return undefined;
}

export function parseJson(raw: string): unknown {
  return JSON.parse(raw);
}

export function parseJsonWithFenceFallback(raw: string): unknown {
  const trimmed = raw.trim();

  try {
    return parseJson(trimmed);
  } catch {
    const fencedJson = extractFencedJson(trimmed);

    if (!fencedJson) {
      throw new AppError("Harness output was not valid JSON.");
    }

    try {
      return parseJson(fencedJson);
    } catch {
      throw new AppError("Harness output contained invalid fenced JSON.");
    }
  }
}

export function extractPrDraft(value: unknown): PrDraft {
  const draft = findDraftInValue(value);

  if (!draft) {
    throw new AppError("Harness output did not include a title/body draft.");
  }

  return draft;
}
