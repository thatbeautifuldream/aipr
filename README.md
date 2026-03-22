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

## GitHub Actions Publishing

Publishing is handled from GitHub Actions.

Create a trusted publisher connection on npm with:

- Organization or user: `thatbeautifuldream`
- Repository: `aipr`
- Workflow filename: `publish.yml`
- Environment name: leave blank unless you want a protected GitHub environment

Once the trusted publisher is connected, run the `Publish` workflow from the GitHub Actions tab and provide:

- `channel=latest` with a `version` like `1.1.1`
- `channel=next` with a prerelease `version` like `1.1.1-beta.0`

The workflow will validate the version, update `package.json`, build, test, commit the release, tag it, publish to npm with provenance, and push the branch and tag back to GitHub.

Published npm versions are not rolled backward or reused.

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
