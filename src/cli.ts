import { Command } from "commander";

import { NodeCommandRunner } from "./command-runner.js";
import { runCreateCommand } from "./create-command.js";
import { runDoctor } from "./doctor.js";
import { AppError } from "./errors.js";
import { createHarnessRegistry, detectHarnesses } from "./harnesses/index.js";
import type { CreateCommandOptions } from "./types.js";
import type { CommandRunner } from "./command-runner.js";

function applyCreateOptions(command: Command): Command {
  return command
    .option("-b, --branch <branch>", "Deprecated alias for --base-branch")
    .option("--base-branch <branch>", "Base branch for the draft PR")
    .option("--base <branch>", "Alias for --base-branch")
    .option("--head-branch <branch>", "Head branch for the draft PR")
    .option("--head <branch>", "Alias for --head-branch")
    .option("--harness <harness>", "Harness to use: claude, codex, gemini")
    .option("--model <model>", "Harness model override")
    .option("--dry-run", "Generate PR content without creating the PR")
    .option("--json", "Emit machine-readable JSON")
    .option("--verbose", "Include extra error detail");
}

function mergeAliases(options: CreateCommandOptions & { base?: string; head?: string }) {
  return {
    ...options,
    baseBranch: options.baseBranch ?? options.base,
    headBranch: options.headBranch ?? options.head,
  };
}

function printResult(value: unknown, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }

  if (typeof value === "string") {
    console.log(value);
    return;
  }

  console.log(JSON.stringify(value, null, 2));
}

function printError(error: unknown, asJson: boolean, verbose: boolean): void {
  if (asJson) {
    if (error instanceof AppError) {
      console.error(
        JSON.stringify(
          {
            error: error.message,
            stdout: verbose ? error.stdout : undefined,
            stderr: verbose ? error.stderr : undefined,
            exitCode: error.exitCode,
          },
          null,
          2
        )
      );
      return;
    }

    console.error(
      JSON.stringify(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2
      )
    );
    return;
  }

  if (error instanceof AppError) {
    console.error(`Error: ${error.message}`);

    if (verbose && error.stdout) {
      console.error(`stdout:\n${error.stdout}`);
    }

    if (verbose && error.stderr) {
      console.error(`stderr:\n${error.stderr}`);
    }

    return;
  }

  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
}

export function createProgram({
  cwd = process.cwd(),
  runner = new NodeCommandRunner(),
}: {
  cwd?: string;
  runner?: CommandRunner;
} = {}): Command {
  const program = new Command();

  program
    .name("aipr")
    .description("Create AI-generated draft pull requests");

  const handleCreate = async (
    options: CreateCommandOptions & { base?: string; head?: string }
  ) => {
    const mergedOptions = mergeAliases(options);

    try {
      const result = await runCreateCommand(runner, cwd, mergedOptions);

      if (mergedOptions.json) {
        printResult(result, true);
        return;
      }

      if (result.dryRun) {
        console.log(`Harness: ${result.harness}`);
        console.log(`Base: ${result.baseBranch}`);
        console.log(`Head: ${result.headBranch}`);
        console.log(`Title: ${result.draft.title}\n`);
        console.log(result.draft.body);
        return;
      }

      console.log(result.pullRequestUrl);
    } catch (error) {
      printError(error, Boolean(mergedOptions.json), Boolean(mergedOptions.verbose));
      process.exitCode = 1;
    }
  };

  applyCreateOptions(program).action(handleCreate);

  applyCreateOptions(program.command("create").description("Create a draft pull request")).action(
    handleCreate
  );

  program
    .command("harness")
    .description("Harness utilities")
    .command("list")
    .description("List supported harnesses")
    .option("--json", "Emit machine-readable JSON")
    .action(async (options) => {
      try {
        const results = await detectHarnesses(createHarnessRegistry(runner, cwd));

        if (options.json) {
          printResult(results, true);
          return;
        }

        for (const result of results) {
          console.log(
            `${result.name}\t${result.installed ? "installed" : "missing"}\t${result.supportsNativeStructuredOutput ? "native-json" : "prompt-json"}\t${result.detail}`
          );
        }
      } catch (error) {
        printError(error, Boolean(options.json), false);
        process.exitCode = 1;
      }
    });

  program
    .command("doctor")
    .description("Check git, gh, and harness readiness")
    .option("--json", "Emit machine-readable JSON")
    .action(async (options) => {
      try {
        const results = await runDoctor(runner, cwd);

        if (options.json) {
          printResult(results, true);
          return;
        }

        for (const result of results) {
          console.log(`${result.ok ? "ok" : "fail"}\t${result.name}\t${result.detail}`);
        }
      } catch (error) {
        printError(error, Boolean(options.json), false);
        process.exitCode = 1;
      }
    });

  return program;
}
