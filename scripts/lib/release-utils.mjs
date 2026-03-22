import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const PACKAGE_NAME = "aipr";

export function parseSemver(version) {
  const match = version.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+)\.(\d+))?$/
  );

  if (!match) {
    throw new Error(`Invalid semver: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prereleaseTag: match[4] ?? null,
    prereleaseNumber: match[5] ? Number(match[5]) : null,
  };
}

export function formatSemver(parsed) {
  const stable = `${parsed.major}.${parsed.minor}.${parsed.patch}`;

  if (parsed.prereleaseTag === null || parsed.prereleaseNumber === null) {
    return stable;
  }

  return `${stable}-${parsed.prereleaseTag}.${parsed.prereleaseNumber}`;
}

export function compareSemver(left, right) {
  const a = typeof left === "string" ? parseSemver(left) : left;
  const b = typeof right === "string" ? parseSemver(right) : right;

  for (const key of ["major", "minor", "patch"]) {
    if (a[key] !== b[key]) {
      return a[key] > b[key] ? 1 : -1;
    }
  }

  const aHasPrerelease = a.prereleaseTag !== null;
  const bHasPrerelease = b.prereleaseTag !== null;

  if (!aHasPrerelease && !bHasPrerelease) {
    return 0;
  }

  if (!aHasPrerelease) {
    return 1;
  }

  if (!bHasPrerelease) {
    return -1;
  }

  if (a.prereleaseTag !== b.prereleaseTag) {
    return a.prereleaseTag > b.prereleaseTag ? 1 : -1;
  }

  if (a.prereleaseNumber === b.prereleaseNumber) {
    return 0;
  }

  return a.prereleaseNumber > b.prereleaseNumber ? 1 : -1;
}

export function sortSemvers(versions) {
  return [...versions].sort(compareSemver);
}

export function getLatestStableVersion(versions) {
  const stableVersions = versions.filter((version) => {
    const parsed = parseSemver(version);
    return parsed.prereleaseTag === null;
  });

  if (stableVersions.length === 0) {
    throw new Error("No stable versions found.");
  }

  return sortSemvers(stableVersions).at(-1);
}

export function bumpStableVersion(version, bump) {
  const parsed = parseSemver(version);

  if (parsed.prereleaseTag !== null) {
    throw new Error(`Expected stable version, received ${version}`);
  }

  if (bump === "patch") {
    parsed.patch += 1;
  } else if (bump === "minor") {
    parsed.minor += 1;
    parsed.patch = 0;
  } else if (bump === "major") {
    parsed.major += 1;
    parsed.minor = 0;
    parsed.patch = 0;
  } else {
    throw new Error(`Unsupported bump type: ${bump}`);
  }

  return formatSemver(parsed);
}

export function computeNextPrereleaseVersion({
  publishedVersions,
  latestStableVersion,
  bump,
  preid = "beta",
}) {
  const nextBase = bumpStableVersion(latestStableVersion, bump);
  const nextBaseParsed = parseSemver(nextBase);

  const matchingPublished = publishedVersions
    .map((version) => parseSemver(version))
    .filter((parsed) => {
      return (
        parsed.major === nextBaseParsed.major &&
        parsed.minor === nextBaseParsed.minor &&
        parsed.patch === nextBaseParsed.patch &&
        parsed.prereleaseTag === preid
      );
    })
    .sort(compareSemver);

  const lastMatch = matchingPublished.at(-1);

  return formatSemver({
    ...nextBaseParsed,
    prereleaseTag: preid,
    prereleaseNumber:
      lastMatch?.prereleaseNumber === null || lastMatch === undefined
        ? 0
        : lastMatch.prereleaseNumber + 1,
  });
}

export function resolveReleaseVersion({
  channel,
  bump,
  explicitVersion,
  publishedVersions,
  preid = "beta",
}) {
  if ((bump && explicitVersion) || (!bump && !explicitVersion)) {
    throw new Error("Provide exactly one of --bump or --version.");
  }

  const sortedPublished = sortSemvers(publishedVersions);
  const latestStableVersion = getLatestStableVersion(sortedPublished);

  let targetVersion;

  if (explicitVersion) {
    parseSemver(explicitVersion);
    targetVersion = explicitVersion;
  } else if (channel === "next") {
    targetVersion = computeNextPrereleaseVersion({
      publishedVersions: sortedPublished,
      latestStableVersion,
      bump,
      preid,
    });
  } else if (channel === "latest") {
    targetVersion = bumpStableVersion(latestStableVersion, bump);
  } else {
    throw new Error(`Unsupported release channel: ${channel}`);
  }

  if (sortedPublished.includes(targetVersion)) {
    throw new Error(`Version ${targetVersion} is already published.`);
  }

  if (compareSemver(targetVersion, latestStableVersion) <= 0) {
    throw new Error(
      `Version ${targetVersion} must be greater than latest stable ${latestStableVersion}.`
    );
  }

  return {
    latestStableVersion,
    targetVersion,
  };
}

export async function runCommand(command, args, options = {}) {
  try {
    const result = await execFileAsync(command, args, {
      cwd: options.cwd,
      env: options.env,
    });

    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
      exitCode: 0,
    };
  } catch (error) {
    return {
      stdout: error.stdout?.trim?.() ?? "",
      stderr: error.stderr?.trim?.() ?? error.message,
      exitCode: error.code ?? 1,
    };
  }
}

export async function runChecked(command, args, options = {}) {
  const result = await runCommand(command, args, options);

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed: ${command}`);
  }

  return result.stdout;
}

export async function readPackageJson(packageJsonPath) {
  return JSON.parse(await readFile(packageJsonPath, "utf8"));
}

export async function writePackageJson(packageJsonPath, packageJson) {
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`, "utf8");
}

export function parseJsonishOutput(raw) {
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error("Expected JSON output but received an empty string.");
  }

  return JSON.parse(trimmed);
}

export async function getPublishedMetadata(packageName, commandRunner = runChecked) {
  const [latestRaw, versionsRaw] = await Promise.all([
    commandRunner("npm", ["view", packageName, "version", "--json"]),
    commandRunner("npm", ["view", packageName, "versions", "--json"]),
  ]);

  const latestVersion = parseJsonishOutput(latestRaw);
  const versions = parseJsonishOutput(versionsRaw);

  if (typeof latestVersion !== "string" || !Array.isArray(versions)) {
    throw new Error("Unexpected npm metadata response.");
  }

  return {
    latestVersion,
    versions,
  };
}

export async function getCurrentBranch(commandRunner = runChecked) {
  return await commandRunner("git", ["branch", "--show-current"]);
}

export async function getCurrentCommit(commandRunner = runChecked) {
  return await commandRunner("git", ["rev-parse", "HEAD"]);
}

export async function ensureCleanWorktree(commandRunner = runChecked) {
  const status = await commandRunner("git", ["status", "--short"]);

  if (status.trim()) {
    throw new Error("Git worktree must be clean before running release automation.");
  }
}

export function getVersionSyncState(localVersion, publishedLatestVersion) {
  const comparison = compareSemver(localVersion, publishedLatestVersion);

  if (comparison === 0) {
    return "in-sync";
  }

  return comparison < 0 ? "local-behind" : "local-ahead";
}
