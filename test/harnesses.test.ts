import test from "node:test";
import assert from "node:assert/strict";

import { ClaudeHarnessAdapter } from "../src/harnesses/claude.js";
import { CodexHarnessAdapter } from "../src/harnesses/codex.js";
import { GeminiHarnessAdapter } from "../src/harnesses/gemini.js";
import { StubRunner } from "./helpers.js";

const baseRequest = {
  baseBranch: "main",
  headBranch: "feature/demo",
  commitLog: "feat: add thing",
  changedFiles: ["src/index.ts"],
  diffStat: " src/index.ts | 2 ++",
};

test("claude harness uses native json output", async () => {
  const runner = new StubRunner(async (spec) => {
    assert.equal(spec.command, "claude");
    assert.match(spec.args.join(" "), /--output-format json/);
    assert.match(spec.args.join(" "), /--json-schema/);

    return {
      stdout: JSON.stringify({ title: "feat: add thing", body: "## Summary\nok" }),
      stderr: "",
      exitCode: 0,
    };
  });

  const adapter = new ClaudeHarnessAdapter(runner, process.cwd());
  const draft = await adapter.generateDraft(baseRequest);
  assert.equal(draft.title, "feat: add thing");
});

test("codex harness falls back to fenced json", async () => {
  const runner = new StubRunner(async (spec) => {
    assert.equal(spec.command, "codex");
    assert.equal(spec.args[0], "exec");

    return {
      stdout: '```json\n{"title":"feat: add thing","body":"## Summary\\nok"}\n```',
      stderr: "",
      exitCode: 0,
    };
  });

  const adapter = new CodexHarnessAdapter(runner, process.cwd());
  const draft = await adapter.generateDraft(baseRequest);
  assert.equal(draft.title, "feat: add thing");
});

test("gemini harness uses non-interactive json output", async () => {
  const runner = new StubRunner(async (spec) => {
    assert.equal(spec.command, "gemini");
    assert.match(spec.args.join(" "), /--output-format json/);

    return {
      stdout: JSON.stringify({ title: "feat: add thing", body: "## Summary\nok" }),
      stderr: "",
      exitCode: 0,
    };
  });

  const adapter = new GeminiHarnessAdapter(runner, process.cwd());
  const draft = await adapter.generateDraft(baseRequest);
  assert.equal(draft.title, "feat: add thing");
});
