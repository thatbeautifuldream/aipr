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
