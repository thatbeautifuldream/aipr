import { buildPrompt } from "../prompt.js";
import type { HarnessRequest, PrDraft } from "../types.js";

import { BaseHarnessAdapter } from "./base.js";

export class GeminiHarnessAdapter extends BaseHarnessAdapter {
  readonly name = "gemini";
  readonly command = "gemini";
  readonly supportsNativeStructuredOutput = true;

  async generateDraft(request: HarnessRequest): Promise<PrDraft> {
    const args = ["--output-format", "json", buildPrompt(request)];

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
