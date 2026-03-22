import test from "node:test";
import assert from "node:assert/strict";

import {
  compareSemver,
  computeNextPrereleaseVersion,
  getVersionSyncState,
  resolveReleaseVersion,
} from "../scripts/lib/release-utils.mjs";

test("getVersionSyncState detects local package behind npm", () => {
  assert.equal(getVersionSyncState("1.0.1", "1.0.2"), "local-behind");
});

test("compareSemver treats stable as newer than prerelease", () => {
  assert.equal(compareSemver("1.1.0", "1.1.0-beta.2"), 1);
});

test("computeNextPrereleaseVersion increments beta line", () => {
  const version = computeNextPrereleaseVersion({
    publishedVersions: ["1.0.2", "1.1.0-beta.0", "1.1.0-beta.1"],
    latestStableVersion: "1.0.2",
    bump: "minor",
  });

  assert.equal(version, "1.1.0-beta.2");
});

test("resolveReleaseVersion derives next prerelease from latest stable", () => {
  const result = resolveReleaseVersion({
    channel: "next",
    bump: "minor",
    publishedVersions: ["1.0.2"],
  });

  assert.equal(result.targetVersion, "1.1.0-beta.0");
});

test("resolveReleaseVersion derives next stable from latest stable", () => {
  const result = resolveReleaseVersion({
    channel: "latest",
    bump: "patch",
    publishedVersions: ["1.0.2", "1.1.0-beta.0"],
  });

  assert.equal(result.targetVersion, "1.0.3");
});

test("resolveReleaseVersion rejects already published explicit versions", () => {
  assert.throws(
    () =>
      resolveReleaseVersion({
        channel: "latest",
        explicitVersion: "1.0.2",
        publishedVersions: ["1.0.2"],
      }),
    /already published/
  );
});
