---
name: user-stories-to-issues
description: Convert a USER-STORIES.md file into GitHub issues. Reads the file, groups stories into feature-area labels, merges near-duplicate stories, produces issues.json and create-issues.sh, then optionally runs the script. Use when the user has a user stories markdown file and wants to track them as GitHub issues.
argument-hint: [path/to/USER-STORIES.md]
allowed-tools: Read, Write, Bash, Glob
---

# Convert User Stories to GitHub Issues

Convert the user stories file at **$ARGUMENTS** into GitHub issues.

## Step 1 — Read the user stories

Read the file at `$ARGUMENTS` (or find `USER-STORIES.md` in the current directory if no argument given).

## Step 2 — Analyse and plan

Before generating any files:

2. **Identify near-duplicates**: stories that cover the same feature from two angles (e.g. "add a checkbox field" and "use checkbox fields"). Plan to merge each pair into one issue with a combined body.
3. Report the planned groupings and merges to the user for awareness before writing files.

## Step 3 — Generate `issues.json`

Write `issues.json` in the same directory as the user stories file.

Schema:
```json
[
  {
    "title": "Short imperative title",
    "body": "As a user I want ... so that ...\n\n**Hints:**\n- ...",
    "labels": ["<component>"]
  }
]
```

Rules:
- Merged pairs: combine both user story sentences in the body under separate lines, then write details.
- Titles are imperative (e.g. "Add a checkbox field", not "Checkbox field").
- Body may include a **Details** section with 2–4 bullet points, but it is not necessary for every issue.

## Step 4 — Generate `create-issues.sh`

Write `create-issues.sh` in the same directory as `issues.json`.

The script must:
1. Verify `gh` and `jq` are installed; exit with a clear error if not.
2. Iterate `issues.json` with `jq -c '.[]'` and call `gh issue create --title ... --body ... --label ...` for each issue.
3. Print progress (`[N/TOTAL] title`) and a summary at the end.
4. Use `set -euo pipefail` and be fully non-interactive.

Make the script executable.

## Step 5 — Verify and report

After writing both files:
- Run `jq 'length' issues.json` to confirm the issue count.
- Run `jq '[.[].labels[]] | unique' issues.json` to confirm the label set.
- Tell the user the counts and ask if they want to run `bash create-issues.sh` now (requires `gh auth login` and `jq`).
