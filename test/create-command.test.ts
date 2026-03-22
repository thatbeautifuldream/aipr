import test from "node:test";
import assert from "node:assert/strict";

import { normalizeCreateOptions, runCreateCommand } from "../src/create-command.js";
import { StubRunner } from "./helpers.js";

test("normalizeCreateOptions maps deprecated branch flag", () => {
  const result = normalizeCreateOptions({ branch: "main" });
  assert.equal(result.baseBranch, "main");
});

test("runCreateCommand defaults head branch to current branch", async () => {
  const runner = new StubRunner(async (spec) => {
    const key = `${spec.command} ${spec.args.join(" ")}`;

    if (key === "git rev-parse --is-inside-work-tree") {
      return { stdout: "true\n", stderr: "", exitCode: 0 };
    }

    if (key === "gh --version") {
      return { stdout: "gh version 2\n", stderr: "", exitCode: 0 };
    }

    if (key === "gh auth status") {
      return { stdout: "logged in\n", stderr: "", exitCode: 0 };
    }

    if (key === "git branch --show-current") {
      return { stdout: "feature/demo\n", stderr: "", exitCode: 0 };
    }

    if (key === "git rev-parse --verify --quiet main") {
      return { stdout: "abc\n", stderr: "", exitCode: 0 };
    }

    if (key === "git rev-parse --verify --quiet feature/demo") {
      return { stdout: "def\n", stderr: "", exitCode: 0 };
    }

    if (key === "git rev-list --left-right --count main...feature/demo") {
      return { stdout: "0\t2\n", stderr: "", exitCode: 0 };
    }

    if (key === "git log --format=%s%n%b%n---END-COMMIT--- main..feature/demo") {
      return { stdout: "feat: test\n\n---END-COMMIT---\n", stderr: "", exitCode: 0 };
    }

    if (key === "git diff --name-only main...feature/demo") {
      return { stdout: "src/index.ts\n", stderr: "", exitCode: 0 };
    }

    if (key === "git diff --stat main...feature/demo") {
      return { stdout: " src/index.ts | 2 ++\n", stderr: "", exitCode: 0 };
    }

    if (key === "claude --version") {
      return { stdout: "1.0.0\n", stderr: "", exitCode: 0 };
    }

    if (spec.command === "claude") {
      return {
        stdout: JSON.stringify({ title: "feat: test", body: "## Summary\nok" }),
        stderr: "",
        exitCode: 0,
      };
    }

    if (spec.command === "gh" && spec.args[0] === "pr") {
      return {
        stdout: "https://github.com/example/repo/pull/123\n",
        stderr: "",
        exitCode: 0,
      };
    }

    throw new Error(`Unexpected command: ${key}`);
  });

  const result = await runCreateCommand(runner, process.cwd(), { baseBranch: "main" });

  assert.equal(result.headBranch, "feature/demo");
  assert.equal(result.harness, "claude");
  assert.equal(result.pullRequestUrl, "https://github.com/example/repo/pull/123");
});

test("runCreateCommand rejects when head is not ahead", async () => {
  const runner = new StubRunner(async (spec) => {
    const key = `${spec.command} ${spec.args.join(" ")}`;

    if (key === "git rev-parse --is-inside-work-tree") {
      return { stdout: "true\n", stderr: "", exitCode: 0 };
    }

    if (key === "gh --version") {
      return { stdout: "gh version 2\n", stderr: "", exitCode: 0 };
    }

    if (key === "gh auth status") {
      return { stdout: "logged in\n", stderr: "", exitCode: 0 };
    }

    if (key === "git branch --show-current") {
      return { stdout: "feature/demo\n", stderr: "", exitCode: 0 };
    }

    if (key === "git rev-parse --verify --quiet main" || key === "git rev-parse --verify --quiet feature/demo") {
      return { stdout: "abc\n", stderr: "", exitCode: 0 };
    }

    if (key === "git rev-list --left-right --count main...feature/demo") {
      return { stdout: "0\t0\n", stderr: "", exitCode: 0 };
    }

    throw new Error(`Unexpected command: ${key}`);
  });

  await assert.rejects(
    runCreateCommand(runner, process.cwd(), { baseBranch: "main" }),
    /No commits ahead/
  );
});
