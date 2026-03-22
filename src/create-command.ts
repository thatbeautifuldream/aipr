import type { CommandRunner } from "./command-runner.js";
import { AppError } from "./errors.js";
import {
  assertInsideGitRepo,
  assertRevisionExists,
  collectPrContext,
  compareBranches,
  getCurrentBranch,
} from "./git.js";
import { assertGitHubCliReady, createDraftPullRequest } from "./github.js";
import { createHarnessRegistry, selectHarness } from "./harnesses/index.js";
import type { CreateCommandOptions, NormalizedCreateOptions } from "./types.js";

export interface CreateCommandResult {
  baseBranch: string;
  headBranch: string;
  harness: string;
  draft: {
    title: string;
    body: string;
  };
  pullRequestUrl?: string;
  dryRun: boolean;
}

export function normalizeCreateOptions(options: CreateCommandOptions): NormalizedCreateOptions {
  const baseBranch = options.baseBranch ?? options.branch;

  if (!baseBranch) {
    throw new AppError("A base branch is required. Use --base-branch or -b.");
  }

  return {
    baseBranch: stripLeadingEquals(baseBranch),
    headBranch: options.headBranch ? stripLeadingEquals(options.headBranch) : undefined,
    harness: options.harness,
    model: options.model,
    dryRun: Boolean(options.dryRun),
    json: Boolean(options.json),
    verbose: Boolean(options.verbose),
  };
}

function stripLeadingEquals(value: string): string {
  return value.startsWith("=") ? value.slice(1) : value;
}

export async function runCreateCommand(
  runner: CommandRunner,
  cwd: string,
  rawOptions: CreateCommandOptions
): Promise<CreateCommandResult> {
  const options = normalizeCreateOptions(rawOptions);

  await assertInsideGitRepo(runner, cwd);
  await assertGitHubCliReady(runner, cwd);

  const headBranch = options.headBranch ?? (await getCurrentBranch(runner, cwd));
  const baseBranch = options.baseBranch;

  if (baseBranch === headBranch) {
    throw new AppError("Base branch and head branch must be different.");
  }

  await assertRevisionExists(runner, cwd, baseBranch, "Base branch");
  await assertRevisionExists(runner, cwd, headBranch, "Head branch");

  const comparison = await compareBranches(runner, cwd, baseBranch, headBranch);
  if (comparison.ahead === 0) {
    throw new AppError(`No commits ahead of ${baseBranch} on ${headBranch}.`);
  }

  const context = await collectPrContext(runner, cwd, baseBranch, headBranch);
  const harness = await selectHarness(createHarnessRegistry(runner, cwd), options.harness);
  const draft = await harness.generateDraft({
    ...context,
    model: options.model,
  });

  if (options.dryRun) {
    return {
      baseBranch,
      headBranch,
      harness: harness.name,
      draft,
      dryRun: true,
    };
  }

  const pullRequestUrl = await createDraftPullRequest(runner, cwd, {
    baseBranch,
    headBranch,
    draft,
  });

  return {
    baseBranch,
    headBranch,
    harness: harness.name,
    draft,
    pullRequestUrl,
    dryRun: false,
  };
}
