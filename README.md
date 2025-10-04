# aipr

Make your PRs with AI.

## Install

```bash
pnpm install -g aipr
```

## Usage

```bash
aipr -b <base-branch>
```

Creates a draft PR against the specified branch using AI to generate the title and description.

## Requirements

- Git repository with commits ahead of the base branch and pushed to remote branch as well.
- Claude Code `pnpm install -g @anthropic-ai/claude-code` installed and setup

## Example

```bash
aipr -b main
```
