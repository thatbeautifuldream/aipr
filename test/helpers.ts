import type { CommandResult, CommandSpec } from "../src/types.js";
import type { CommandRunner } from "../src/command-runner.js";

export class StubRunner implements CommandRunner {
  readonly calls: CommandSpec[] = [];

  constructor(
    private readonly handler: (spec: CommandSpec) => CommandResult | Promise<CommandResult>
  ) {}

  async run(spec: CommandSpec): Promise<CommandResult> {
    this.calls.push(spec);
    return await this.handler(spec);
  }
}
