import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getPublishedMetadata,
  getVersionSyncState,
  PACKAGE_NAME,
  readPackageJson,
} from "./lib/release-utils.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(scriptDirectory, "..", "package.json");

export async function checkVersionSync() {
  const packageJson = await readPackageJson(packageJsonPath);
  const metadata = await getPublishedMetadata(PACKAGE_NAME);
  const state = getVersionSyncState(packageJson.version, metadata.latestVersion);

  return {
    packageName: PACKAGE_NAME,
    localVersion: packageJson.version,
    publishedLatestVersion: metadata.latestVersion,
    state,
  };
}

async function main() {
  try {
    const result = await checkVersionSync();
    console.log(JSON.stringify(result, null, 2));

    if (result.state === "local-behind") {
      process.exitCode = 1;
    }
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
