import { spawn } from "node:child_process";

import { AppError } from "./errors.js";
import type { CommandResult, CommandSpec } from "./types.js";

export interface CommandRunner {
  run(spec: CommandSpec): Promise<CommandResult>;
}

export class NodeCommandRunner implements CommandRunner {
  async run(spec: CommandSpec): Promise<CommandResult> {
    return await new Promise<CommandResult>((resolve, reject) => {
      const child = spawn(spec.command, spec.args, {
        cwd: spec.cwd,
        env: spec.env,
        stdio: "pipe",
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      child.on("error", (error) => {
        reject(new AppError(`Failed to start ${spec.command}: ${error.message}`));
      });

      child.on("close", (exitCode) => {
        resolve({
          stdout,
          stderr,
          exitCode: exitCode ?? 1,
        });
      });

      if (spec.stdin) {
        child.stdin.write(spec.stdin);
      }

      child.stdin.end();
    });
  }
}

export async function runChecked(
  runner: CommandRunner,
  spec: CommandSpec,
  message: string
): Promise<CommandResult> {
  const result = await runner.run(spec);

  if (result.exitCode !== 0) {
    throw new AppError(message, {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
      exitCode: result.exitCode,
    });
  }

  return result;
}
