import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getPublishedMetadata,
  getVersionSyncState,
  PACKAGE_NAME,
  readPackageJson,
  writePackageJson,
} from "./lib/release-utils.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(scriptDirectory, "..", "package.json");

export async function syncVersion() {
  const packageJson = await readPackageJson(packageJsonPath);
  const metadata = await getPublishedMetadata(PACKAGE_NAME);
  const state = getVersionSyncState(packageJson.version, metadata.latestVersion);

  if (state === "local-ahead") {
    throw new Error(
      `Local version ${packageJson.version} is ahead of npm latest ${metadata.latestVersion}. Refusing to sync downward.`
    );
  }

  if (state === "local-behind") {
    packageJson.version = metadata.latestVersion;
    await writePackageJson(packageJsonPath, packageJson);
  }

  return {
    packageName: PACKAGE_NAME,
    previousLocalVersion: packageJson.version,
    publishedLatestVersion: metadata.latestVersion,
    state,
    updated: state === "local-behind",
  };
}

async function main() {
  try {
    const packageJson = await readPackageJson(packageJsonPath);
    const previousLocalVersion = packageJson.version;
    const metadata = await getPublishedMetadata(PACKAGE_NAME);
    const state = getVersionSyncState(previousLocalVersion, metadata.latestVersion);

    if (state === "local-ahead") {
      throw new Error(
        `Local version ${previousLocalVersion} is ahead of npm latest ${metadata.latestVersion}. Refusing to sync downward.`
      );
    }

    let updated = false;
    if (state === "local-behind") {
      packageJson.version = metadata.latestVersion;
      await writePackageJson(packageJsonPath, packageJson);
      updated = true;
    }

    console.log(
      JSON.stringify(
        {
          packageName: PACKAGE_NAME,
          previousLocalVersion,
          publishedLatestVersion: metadata.latestVersion,
          state,
          updated,
        },
        null,
        2
      )
    );
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
