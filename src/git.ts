import { readFile } from "node:fs/promises";
import path from "node:path";

import { runChecked, type CommandRunner } from "./command-runner.js";
import { AppError } from "./errors.js";
import type { BranchComparison, PrContext } from "./types.js";

async function runGit(
  runner: CommandRunner,
  cwd: string,
  args: string[],
  message: string
) {
  return await runChecked(
    runner,
    { command: "git", args, cwd },
    message
  );
}

export async function assertInsideGitRepo(
  runner: CommandRunner,
  cwd: string
): Promise<void> {
  await runGit(runner, cwd, ["rev-parse", "--is-inside-work-tree"], "Not inside a git repository.");
}

export async function getCurrentBranch(
  runner: CommandRunner,
  cwd: string
): Promise<string> {
  const result = await runGit(
    runner,
    cwd,
    ["branch", "--show-current"],
    "Failed to determine the current branch."
  );

  const branch = result.stdout.trim();

  if (!branch) {
    throw new AppError("Current branch could not be determined.");
  }

  return branch;
}

export async function assertRevisionExists(
  runner: CommandRunner,
  cwd: string,
  revision: string,
  label: string
): Promise<void> {
  const result = await runner.run({
    command: "git",
    args: ["rev-parse", "--verify", "--quiet", revision],
    cwd,
  });

  if (result.exitCode !== 0) {
    throw new AppError(`${label} "${revision}" does not exist.`);
  }
}

export async function compareBranches(
  runner: CommandRunner,
  cwd: string,
  baseBranch: string,
  headBranch: string
): Promise<BranchComparison> {
  const result = await runGit(
    runner,
    cwd,
    ["rev-list", "--left-right", "--count", `${baseBranch}...${headBranch}`],
    "Failed to compare branches."
  );

  const [behindText = "0", aheadText = "0"] = result.stdout.trim().split("\t");

  return {
    behind: Number(behindText),
    ahead: Number(aheadText),
  };
}

export async function collectPrContext(
  runner: CommandRunner,
  cwd: string,
  baseBranch: string,
  headBranch: string
): Promise<PrContext> {
  const [commitLogResult, changedFilesResult, diffStatResult] = await Promise.all([
    runGit(
      runner,
      cwd,
      ["log", "--format=%s%n%b%n---END-COMMIT---", `${baseBranch}..${headBranch}`],
      "Failed to collect commit log."
    ),
    runGit(
      runner,
      cwd,
      ["diff", "--name-only", `${baseBranch}...${headBranch}`],
      "Failed to collect changed files."
    ),
    runGit(
      runner,
      cwd,
      ["diff", "--stat", `${baseBranch}...${headBranch}`],
      "Failed to collect diff stat."
    ),
  ]);

  return {
    baseBranch,
    headBranch,
    commitLog: commitLogResult.stdout.trim(),
    changedFiles: changedFilesResult.stdout
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean),
    diffStat: diffStatResult.stdout.trim(),
    prTemplate: await readPullRequestTemplate(cwd),
  };
}

async function readPullRequestTemplate(cwd: string): Promise<string | undefined> {
  const templatePath = path.join(cwd, ".github", "pull_request_template.md");

  try {
    const template = await readFile(templatePath, "utf8");
    return template.trim();
  } catch {
    return undefined;
  }
}
