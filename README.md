# aipr

Make your draft PRs with AI.

## Install

```bash
pnpm install -g aipr
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
