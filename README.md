# aipr

Make your draft PRs with AI.

## Install

```bash
pnpm install -g aipr
```

## Local Development

Build and run the CLI without publishing:

```bash
pnpm run build
node dist/src/index.js --base-branch main
```

Link it globally to use the `aipr` command locally:

```bash
pnpm link --global
aipr --base-branch main
```

## Release Workflow

Keep the local package version aligned with npm before cutting releases:

```bash
pnpm version:check
pnpm version:sync
```

Dry-run the release automation:

```bash
pnpm release:check
pnpm release -- --channel next --bump minor --dry-run
```

Publish a prerelease from any branch:

```bash
pnpm release -- --channel next --bump minor
```

Publish a stable release:

```bash
pnpm release -- --channel latest --bump patch
```

Stable releases from non-`main` require an explicit override:

```bash
pnpm release -- --channel latest --bump patch --allow-non-main-latest
```

Published npm versions are not rolled backward or reused. If confidence is low, use the `next` channel first.

## Usage

```bash
aipr --base-branch main
```

Create a GitHub draft PR for the current branch against the specified base branch.

Explicit source and target branches:

```bash
aipr create --base-branch main --head-branch feature/multi-harness
```

Choose a harness:

```bash
aipr --base-branch main --harness codex
```

Dry run:

```bash
aipr --base-branch main --dry-run
```

## Supported Harnesses

- Claude Code
- Codex CLI
- Gemini CLI

## Requirements

- Git repository with commits ahead of the base branch
- GitHub CLI `gh` installed and authenticated
- One supported harness installed and authenticated

## Commands

```bash
aipr harness list
aipr doctor
```
