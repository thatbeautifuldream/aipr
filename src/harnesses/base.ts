import { runChecked, type CommandRunner } from "../command-runner.js";
import { AppError } from "../errors.js";
import { extractPrDraft, parseJson, parseJsonWithFenceFallback } from "../json.js";
import type {
  CommandSpec,
  HarnessAdapter,
  HarnessDetectionResult,
  HarnessName,
  HarnessRequest,
  PrDraft,
} from "../types.js";
import { validateDraft } from "../validation.js";

export abstract class BaseHarnessAdapter implements HarnessAdapter {
  abstract readonly name: HarnessName;
  abstract readonly command: string;
  abstract readonly supportsNativeStructuredOutput: boolean;

  constructor(protected readonly runner: CommandRunner, protected readonly cwd: string) {}

  async detect(): Promise<HarnessDetectionResult> {
    const result = await this.runner.run({
      command: this.command,
      args: ["--version"],
      cwd: this.cwd,
    });

    if (result.exitCode !== 0) {
      return {
        name: this.name,
        command: this.command,
        installed: false,
        supportsNativeStructuredOutput: this.supportsNativeStructuredOutput,
        detail: result.stderr.trim() || result.stdout.trim() || "Command not available",
      };
    }

    return {
      name: this.name,
      command: this.command,
      installed: true,
      supportsNativeStructuredOutput: this.supportsNativeStructuredOutput,
      detail: result.stdout.trim() || result.stderr.trim() || "Installed",
    };
  }

  protected async runCommand(spec: CommandSpec): Promise<{ stdout: string; stderr: string }> {
    const result = await runChecked(
      this.runner,
      { ...spec, cwd: this.cwd },
      `Failed to generate PR draft with ${this.name}.`
    );

    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  }

  protected parseNativeJson(stdout: string): PrDraft {
    const parsed = parseJson(stdout);
    return validateDraft(extractPrDraft(parsed));
  }

  protected parsePromptJson(stdout: string): PrDraft {
    const parsed = parseJsonWithFenceFallback(stdout);
    return validateDraft(extractPrDraft(parsed));
  }

  protected ensureOutput(stdout: string): string {
    if (!stdout.trim()) {
      throw new AppError(`${this.name} returned empty output.`);
    }

    return stdout;
  }

  abstract generateDraft(request: HarnessRequest): Promise<PrDraft>;
}
