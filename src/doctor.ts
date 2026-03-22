import { assertInsideGitRepo } from "./git.js";
import { detectHarnesses } from "./harnesses/index.js";
import { createHarnessRegistry } from "./harnesses/index.js";
import type { CommandRunner } from "./command-runner.js";
import type { DoctorCheck } from "./types.js";

export async function runDoctor(
  runner: CommandRunner,
  cwd: string
): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];

  try {
    await assertInsideGitRepo(runner, cwd);
    checks.push({ name: "git repo", ok: true, detail: "Inside a git repository" });
  } catch (error) {
    checks.push({ name: "git repo", ok: false, detail: error instanceof Error ? error.message : "Unknown error" });
  }

  const ghVersion = await runner.run({ command: "gh", args: ["--version"], cwd });
  checks.push({
    name: "gh installed",
    ok: ghVersion.exitCode === 0,
    detail: ghVersion.exitCode === 0 ? "GitHub CLI detected" : (ghVersion.stderr.trim() || ghVersion.stdout.trim() || "GitHub CLI not found"),
  });

  const ghAuth = await runner.run({ command: "gh", args: ["auth", "status"], cwd });
  checks.push({
    name: "gh auth",
    ok: ghAuth.exitCode === 0,
    detail: ghAuth.exitCode === 0 ? "GitHub CLI authenticated" : (ghAuth.stderr.trim() || ghAuth.stdout.trim() || "GitHub CLI auth failed"),
  });

  const harnesses = await detectHarnesses(createHarnessRegistry(runner, cwd));
  for (const harness of harnesses) {
    checks.push({
      name: `${harness.name} harness`,
      ok: harness.installed,
      detail: harness.detail,
    });
  }

  return checks;
}
