# aipr

Make your PRs with AI.

## Install

```bash
pnpm install -g aipr
```

## Usage

```bash
aipr --branch=<base-branch>
```

Creates a draft PR against the specified branch using AI to generate the title and description.

## Requirements

- Git repository with commits ahead of the base branch
- Claude Code `pnpm install -g @anthropic-ai/claude-code` installed

## Example

```bash
aipr --branch=main
```
