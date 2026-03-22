import type { CommandRunner } from "../command-runner.js";
import { AppError } from "../errors.js";
import type { HarnessAdapter, HarnessDetectionResult, HarnessName } from "../types.js";

import { ClaudeHarnessAdapter } from "./claude.js";
import { CodexHarnessAdapter } from "./codex.js";
import { GeminiHarnessAdapter } from "./gemini.js";

export function createHarnessRegistry(
  runner: CommandRunner,
  cwd: string
): Record<HarnessName, HarnessAdapter> {
  return {
    claude: new ClaudeHarnessAdapter(runner, cwd),
    codex: new CodexHarnessAdapter(runner, cwd),
    gemini: new GeminiHarnessAdapter(runner, cwd),
  };
}

export async function detectHarnesses(
  registry: Record<HarnessName, HarnessAdapter>
): Promise<HarnessDetectionResult[]> {
  return await Promise.all(
    Object.values(registry).map(async (adapter) => await adapter.detect())
  );
}

export async function selectHarness(
  registry: Record<HarnessName, HarnessAdapter>,
  requestedHarness?: HarnessName
): Promise<HarnessAdapter> {
  if (requestedHarness) {
    const adapter = registry[requestedHarness];
    const detection = await adapter.detect();

    if (!detection.installed) {
      throw new AppError(`Requested harness "${requestedHarness}" is not installed: ${detection.detail}`);
    }

    return adapter;
  }

  for (const name of ["claude", "codex", "gemini"] as const) {
    const adapter = registry[name];
    const detection = await adapter.detect();

    if (detection.installed) {
      return adapter;
    }
  }

  throw new AppError("No supported harness was detected. Install claude, codex, or gemini.");
}
