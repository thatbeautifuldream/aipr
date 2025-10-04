#!/usr/bin/env node

import { exec as execCallback, spawn } from "node:child_process";
import { promisify } from "node:util";
import { program } from "commander";

const exec = promisify(execCallback);

program
  .name("aipr")
  .description("Create AI-generated draft pull requests")
  .requiredOption("-b, --branch <branch>", "Branch name for the draft PR")
  .parse(process.argv);

const options = program.opts();

if (options.branch?.startsWith("=")) {
  options.branch = options.branch.slice(1);
}

async function runCommand(command: string) {
  const { stdout } = await exec(command);
  return stdout.trim();
}

async function main() {
  try {
    await runCommand("git rev-parse --is-inside-work-tree");

    const aheadCountOutput = await runCommand(
      `git rev-list --left-right --count ${options.branch}...HEAD`
    );
    const aheadCount = Number(aheadCountOutput.split("\t")[1] || "0");

    if (aheadCount === 0) {
      // biome-ignore lint/suspicious/noConsole: error handling
      console.error(
        `No commits ahead of the ${options.branch} branch to create a PR.`
      );
      process.exit(1);
    }

    const systemPrompt = `system: you are to make a draft pull request against the ${options.branch} branch. title should use conventional commit style, all smallcase. description should have no attribution. do not assign, label, or mention anyone. always create the pr as draft.`;

    // biome-ignore lint/suspicious/noConsole: required output
    console.log(
      "Starting Claude to generate draft pull request...\n"
    );

    await new Promise<void>((resolve, reject) => {
      const aiProcess = spawn("claude", [
        "--dangerously-skip-permissions",
        "-p",
        systemPrompt,
      ], {
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      aiProcess.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`AI process exited with code ${code}`));
        }
      });

      aiProcess.on("error", (error) => {
        reject(error);
      });
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: error handling
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
