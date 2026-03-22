import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ensureCleanWorktree,
  getCurrentBranch,
  getCurrentCommit,
  getPublishedMetadata,
  getVersionSyncState,
  PACKAGE_NAME,
  readPackageJson,
  resolveReleaseVersion,
  runChecked,
  writePackageJson,
} from "./lib/release-utils.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(scriptDirectory, "..", "package.json");

function parseArguments(argv) {
  const parsed = {
    channel: undefined,
    bump: undefined,
    version: undefined,
    dryRun: false,
    allowNonMainLatest: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--channel") {
      parsed.channel = argv[index + 1];
      index += 1;
    } else if (current === "--bump") {
      parsed.bump = argv[index + 1];
      index += 1;
    } else if (current === "--version") {
      parsed.version = argv[index + 1];
      index += 1;
    } else if (current === "--dry-run") {
      parsed.dryRun = true;
    } else if (current === "--allow-non-main-latest") {
      parsed.allowNonMainLatest = true;
    } else {
      throw new Error(`Unknown argument: ${current}`);
    }
  }

  if (parsed.channel !== "next" && parsed.channel !== "latest") {
    throw new Error("Use --channel next or --channel latest.");
  }

  return parsed;
}

export async function createReleasePlan(options) {
  const packageJson = await readPackageJson(packageJsonPath);
  const branch = await getCurrentBranch();
  const commitSha = await getCurrentCommit();
  const publishedMetadata = await getPublishedMetadata(PACKAGE_NAME);
  const versionSyncState = getVersionSyncState(
    packageJson.version,
    publishedMetadata.latestVersion
  );

  if (versionSyncState === "local-behind") {
    throw new Error(
      `Local package version ${packageJson.version} is behind npm latest ${publishedMetadata.latestVersion}. Run pnpm version:sync first.`
    );
  }

  if (
    options.channel === "latest" &&
    branch !== "main" &&
    !options.allowNonMainLatest
  ) {
    throw new Error(
      "Stable publishes from non-main require --allow-non-main-latest."
    );
  }

  const releaseVersion = resolveReleaseVersion({
    channel: options.channel,
    bump: options.bump,
    explicitVersion: options.version,
    publishedVersions: publishedMetadata.versions,
  });

  return {
    packageName: PACKAGE_NAME,
    branch,
    commitSha,
    currentLocalVersion: packageJson.version,
    publishedLatestVersion: publishedMetadata.latestVersion,
    targetVersion: releaseVersion.targetVersion,
    channel: options.channel,
    npmTag: options.channel === "next" ? "next" : "latest",
    releaseCommitMessage: `chore(release): v${releaseVersion.targetVersion}`,
    releaseTag: `v${releaseVersion.targetVersion}`,
    dryRun: options.dryRun,
  };
}

async function runRelease(plan) {
  await runChecked("npm", ["whoami"]);
  await ensureCleanWorktree();
  await runChecked("pnpm", ["run", "build"]);
  await runChecked("pnpm", ["test"]);

  const packageJson = await readPackageJson(packageJsonPath);
  packageJson.version = plan.targetVersion;
  await writePackageJson(packageJsonPath, packageJson);

  await runChecked("git", ["add", "package.json"]);
  await runChecked("git", ["commit", "-m", plan.releaseCommitMessage]);
  await runChecked("git", ["tag", plan.releaseTag]);

  const publishArgs = ["publish"];
  if (plan.npmTag === "next") {
    publishArgs.push("--tag", "next");
  }

  await runChecked("npm", publishArgs);
  await runChecked("git", ["push"]);
  await runChecked("git", ["push", "origin", plan.releaseTag]);
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const plan = await createReleasePlan(options);

    console.log(JSON.stringify(plan, null, 2));

    if (options.dryRun) {
      return;
    }

    await runRelease(plan);
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
