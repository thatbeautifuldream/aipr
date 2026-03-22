import type { HarnessRequest } from "./types.js";

export const PR_DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    body: { type: "string" },
  },
  required: ["title", "body"],
};

export function buildPrompt(request: HarnessRequest): string {
  const templateSection = request.prTemplate
    ? `\nPULL REQUEST TEMPLATE:\n${request.prTemplate}\n`
    : "\nPULL REQUEST TEMPLATE:\nNone\n";

  const changedFilesSection =
    request.changedFiles.length > 0
      ? request.changedFiles.map((file) => `- ${file}`).join("\n")
      : "- No changed files detected";

  return [
    "You are generating a GitHub draft pull request title and body.",
    "Return only JSON matching this schema: {\"title\": string, \"body\": string}.",
    "Do not wrap the JSON in markdown unless the harness cannot emit plain JSON.",
    "Rules:",
    "- Title must be lowercase conventional-commit style.",
    "- Body must be useful, concise, and have no attribution.",
    "- Do not assign, label, or mention anyone.",
    "- Assume the PR is always a draft.",
    "",
    `BASE BRANCH: ${request.baseBranch}`,
    `HEAD BRANCH: ${request.headBranch}`,
    "",
    "COMMITS:",
    request.commitLog || "No commit log available.",
    "",
    "DIFF STAT:",
    request.diffStat || "No diff stat available.",
    "",
    "CHANGED FILES:",
    changedFilesSection,
    templateSection.trimEnd(),
  ].join("\n");
}
