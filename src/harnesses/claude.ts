import { buildPrompt, PR_DRAFT_SCHEMA } from "../prompt.js";
import type { HarnessRequest, PrDraft } from "../types.js";

import { BaseHarnessAdapter } from "./base.js";

export class ClaudeHarnessAdapter extends BaseHarnessAdapter {
  readonly name = "claude";
  readonly command = "claude";
  readonly supportsNativeStructuredOutput = true;

  async generateDraft(request: HarnessRequest): Promise<PrDraft> {
    const args = [
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(PR_DRAFT_SCHEMA),
      "--permission-mode",
      "default",
      "-p",
      buildPrompt(request),
    ];

    if (request.model) {
      args.push("--model", request.model);
    }

    const { stdout } = await this.runCommand({
      command: this.command,
      args,
    });

    return this.parseNativeJson(this.ensureOutput(stdout));
  }
}
