import test from "node:test";
import assert from "node:assert/strict";

import { extractPrDraft, parseJsonWithFenceFallback } from "../src/json.js";

test("extractPrDraft finds nested draft", () => {
  const draft = extractPrDraft({
    result: {
      title: "feat: nested",
      body: "## Summary\nnested",
    },
  });

  assert.equal(draft.title, "feat: nested");
});

test("parseJsonWithFenceFallback handles fenced json", () => {
  const parsed = parseJsonWithFenceFallback(
    'before\n```json\n{"title":"feat: fenced","body":"## Summary\\nbody"}\n```\nafter'
  );

  assert.deepEqual(parsed, {
    title: "feat: fenced",
    body: "## Summary\nbody",
  });
});
