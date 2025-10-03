#!/usr/bin/env node

import { exec, spawn } from "node:child_process";
import { program } from "commander";
import ora from "ora";

program
	.requiredOption("--branch <branch>", "Branch name for the draft PR")
	.parse(process.argv);

const options = program.opts();

async function runCommand(command: string) {
	return new Promise<string>((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) return reject(stderr || error.message);
			resolve(stdout.trim());
		});
	});
}

async function main() {
	try {
		// Check inside git repo
		await runCommand("git rev-parse --is-inside-work-tree");

		// Check commits ahead for branch
		const aheadCountOutput = await runCommand(
			`git rev-list --left-right --count ${options.branch}...HEAD`,
		);
		const aheadCount = Number(aheadCountOutput.split("\t")[1] || "0");

		if (aheadCount === 0) {
			console.error(
				`No commits ahead of the ${options.branch} branch to create a PR.`,
			);
			process.exit(1);
		}

		const systemPrompt = `system: you are to make a draft pull request against the ${options.branch} branch. title should use conventional commit style, all smallcase. description should have no attribution. do not assign, label, or mention anyone. always create the pr as draft.`;

		const spinner = ora(
			"Generating draft pull request description via AI...",
		).start();

		const aiProcess = spawn("claude", [
			"--verbose",
			"--dangerously-skip-permissions",
			"-p",
			systemPrompt,
		]);

		aiProcess.stdout.on("data", (data) => {
			spinner.text = `AI output: ${data.toString().trim()}`;
		});

		aiProcess.on("close", (code) => {
			spinner.stop();
			if (code === 0) {
				console.log("\nDraft PR generation complete.");
			} else {
				console.error("AI process failed.");
			}
		});
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

main();
