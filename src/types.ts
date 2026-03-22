export type HarnessName = "claude" | "codex" | "gemini";

export interface PrDraft {
  title: string;
  body: string;
}

export interface CommandSpec {
  command: string;
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdin?: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CreateCommandOptions {
  baseBranch?: string;
  headBranch?: string;
  branch?: string;
  harness?: HarnessName;
  model?: string;
  dryRun?: boolean;
  json?: boolean;
  verbose?: boolean;
}

export interface NormalizedCreateOptions {
  baseBranch: string;
  headBranch?: string;
  harness?: HarnessName;
  model?: string;
  dryRun: boolean;
  json: boolean;
  verbose: boolean;
}

export interface BranchComparison {
  behind: number;
  ahead: number;
}

export interface PrContext {
  baseBranch: string;
  headBranch: string;
  commitLog: string;
  changedFiles: string[];
  diffStat: string;
  prTemplate?: string;
}

export interface HarnessRequest extends PrContext {
  model?: string;
}

export interface HarnessDetectionResult {
  name: HarnessName;
  command: string;
  installed: boolean;
  supportsNativeStructuredOutput: boolean;
  detail: string;
}

export interface HarnessAdapter {
  readonly name: HarnessName;
  readonly command: string;
  readonly supportsNativeStructuredOutput: boolean;
  detect(): Promise<HarnessDetectionResult>;
  generateDraft(request: HarnessRequest): Promise<PrDraft>;
}

export interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
}
