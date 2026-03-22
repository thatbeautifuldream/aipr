# aipr

Create draft GitHub pull requests with AI from your terminal.

`aipr` looks at the commits on your current branch, asks your preferred AI coding harness to write the PR title and description, and opens a draft PR with `gh`.

## Why Use It

- Skip writing PR titles and descriptions by hand
- Keep PRs consistent across Claude Code, Codex CLI, and Gemini CLI
- Stay in the terminal instead of switching between git, your AI tool, and GitHub

## Quick Start

Use it without installing:

```bash
npx aipr --base-branch main
```

Or install it globally:

```bash
pnpm install -g aipr
aipr --base-branch main
```

## Usage

Create a draft PR for your current branch against `main`:

```bash
aipr --base-branch main
```

Run it directly without installing:

```bash
npx aipr --base-branch main
pnpm dlx aipr --base-branch main
```

Use explicit source and target branches:

```bash
aipr create --base-branch main --head-branch feature/multi-harness
```

Choose a specific harness:

```bash
aipr --base-branch main --harness codex
```

Preview the generated PR content without creating the PR:

```bash
aipr --base-branch main --dry-run
```

## Requirements

- Node.js 18+
- Git repository with commits ahead of the base branch
- GitHub CLI `gh` installed and authenticated
- One supported harness installed and authenticated

## Supported Harnesses

- Claude Code
- Codex CLI
- Gemini CLI

## Useful Commands

Check whether your environment is ready:

```bash
aipr doctor
```

See which harnesses are available on your machine:

```bash
aipr harness list
```
