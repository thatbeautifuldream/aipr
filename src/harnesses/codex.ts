import { buildPrompt } from "../prompt.js";
import type { HarnessRequest, PrDraft } from "../types.js";

import { BaseHarnessAdapter } from "./base.js";

export class CodexHarnessAdapter extends BaseHarnessAdapter {
  readonly name = "codex";
  readonly command = "codex";
  readonly supportsNativeStructuredOutput = false;

  async generateDraft(request: HarnessRequest): Promise<PrDraft> {
    const prompt = `${buildPrompt(request)}\n\nReturn strict JSON only if possible. If not, return a single \`\`\`json fenced block and no other content.`;
    const args = ["exec", "--sandbox", "read-only", prompt];

    if (request.model) {
      args.push("--model", request.model);
    }

    const { stdout } = await this.runCommand({
      command: this.command,
      args,
    });

    return this.parsePromptJson(this.ensureOutput(stdout));
  }
}
