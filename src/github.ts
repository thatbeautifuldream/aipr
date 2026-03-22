import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { runChecked, type CommandRunner } from "./command-runner.js";
import { AppError } from "./errors.js";
import type { PrDraft } from "./types.js";

export async function assertGitHubCliReady(
  runner: CommandRunner,
  cwd: string
): Promise<void> {
  await runChecked(runner, { command: "gh", args: ["--version"], cwd }, "GitHub CLI is not installed.");
  await runChecked(
    runner,
    { command: "gh", args: ["auth", "status"], cwd },
    "GitHub CLI is not authenticated."
  );
}

export async function createDraftPullRequest(
  runner: CommandRunner,
  cwd: string,
  input: {
    baseBranch: string;
    headBranch: string;
    draft: PrDraft;
  }
): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "aipr-"));
  const bodyFile = path.join(tempDir, "pr-body.md");

  try {
    await writeFile(bodyFile, input.draft.body, "utf8");

    const result = await runChecked(
      runner,
      {
        command: "gh",
        args: [
          "pr",
          "create",
          "--draft",
          "--base",
          input.baseBranch,
          "--head",
          input.headBranch,
          "--title",
          input.draft.title,
          "--body-file",
          bodyFile,
        ],
        cwd,
      },
      "Failed to create GitHub draft pull request."
    );

    const combinedOutput = `${result.stdout}\n${result.stderr}`;
    const urlMatch = combinedOutput.match(/https:\/\/github\.com\/\S+/);

    if (!urlMatch) {
      throw new AppError("GitHub CLI did not return a pull request URL.", {
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim(),
      });
    }

    return urlMatch[0];
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
