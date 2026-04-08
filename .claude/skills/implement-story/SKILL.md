---
name: implement-story
description: Implement a user story end-to-end — write the code, run existing tests, add new tests if needed, self-review the diff, then commit. Use when the user wants to take a single user story (or GitHub issue title) from backlog to committed code.
argument-hint: "<story description or issue number>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate
---

# Implement a User Story

Implement the user story or feature described in **$ARGUMENTS** end-to-end.

## Step 1 — Understand the story

If `$ARGUMENTS` looks like an issue number, fetch it with `gh issue view $ARGUMENTS` to get full details.

Otherwise treat `$ARGUMENTS` as the story description directly.

Identify:
- What the user can do after this story is done (the acceptance criteria)
- Which app directory is affected (`write/`, `list/`, `agenda/`, `show/`)
- Which files are likely to change

Read the relevant source files before proposing any changes. Do not modify code you have not read.

## Step 2 — Plan

Write a short bullet-list implementation plan (5–10 bullets). Include:
- Files to create or change and why
- Any new types, hooks, or components needed
- How the feature will be tested

Show the plan to the user and wait for approval before proceeding.

## Step 3 — Implement

Make the changes described in the plan.

Rules:
- Follow the patterns already in the codebase (hash routing, `useStorage()`, existing component structure).
- Do not add features, error handling, or abstractions beyond what the story requires.
- Do not add comments unless the logic is non-obvious.
- Keep diffs small and focused.

## Step 4 — Run tests

From the affected app directory, run:

```bash
npm test
```

If tests fail:
1. Read the failure output carefully.
2. Fix the root cause — do not skip or comment out failing tests.
3. Re-run until green.

If the story adds new user-visible behaviour, add at least one Playwright test in `<app>/tests/` covering the happy path. Follow the style of existing test files in that directory.

## Step 5 — Self-review

Run `git diff` and review every changed line.

Check:
- No dead code, debug logs, or commented-out blocks left behind.
- No unrelated files touched.
- Acceptance criteria from Step 1 are met.
- Code follows UI Guidelines (`docs/UI-GUIDELINES.md`) if any UI was changed.

Fix anything found before committing. If nothing needs fixing, state that explicitly.

## Step 6 — Commit

Stage only the files changed for this story. Commit with a conventional commit message:

```
<type>(<scope>): <short imperative description>
```

Where:
- `type` is one of `feat`, `fix`, `refactor`, `test`, `docs`
- `scope` is the app name (e.g. `list`, `write`)
- Description is ≤ 72 characters, imperative mood

Example: `feat(list): add delete item button with confirmation`

Do **not** push unless the user explicitly asks.

## Step 7 — Report

Tell the user:
- What was implemented (1–3 sentences)
- Which files changed
- Test result (pass count or "no existing tests; added N new tests")
- The commit hash
