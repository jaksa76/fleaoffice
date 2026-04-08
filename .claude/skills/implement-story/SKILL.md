---
name: implement-story
description: Pick an unimplemented user story, implement it end-to-end, run tests, review and clean up the code, then commit. Pass a story keyword or number to target a specific story, or omit to let the skill choose the next ready story.
argument-hint: [story keyword or number, e.g. "delete item" or "18"]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# Implement a User Story

Implement a single user story end-to-end: pick → plan → code → test → review → commit.

## Step 1 — Find the story

**If $ARGUMENTS is provided**, search `USER-STORIES.md` for a line matching the argument (by number or keyword) and use that story.

**If no argument**, read `list/USER-STORIES.md` and choose the next story that:
1. Is not yet implemented (check git log and existing source files for evidence)
2. Has its dependencies already met (earlier stories in the file are done)

Show the chosen story to the user before proceeding. State clearly: *"Implementing story N: …"*

## Step 2 — Explore and plan (use Plan mode)

Before writing any code:

1. Read the relevant source files:
   - `list/src/` — all `.tsx` / `.ts` files
   - `list/tests/` — relevant spec files
   - `list/src/style.css`
   - `docs/UI-GUIDELINES.md` and `docs/ARCHITECTURE.md`
   - `list/REQUIREMENTS.md`

2. Identify exactly what needs to change: which files to edit, which to create, which tests to add or update.

3. State the plan concisely (bullet list of changes) and proceed — do not ask for approval unless there is genuine ambiguity about scope.

## Step 3 — Implement

Make all code changes. Follow the existing patterns in the codebase:
- React functional components with hooks
- `useStorage()` for all API calls
- Hash-based routing via `react-router-dom`
- CSS classes in `list/src/style.css` — no inline styles
- Touch targets ≥ 44×44px on mobile (see UI-GUIDELINES)
- Optimistic UI for mutations where the pattern is already established

Do not add features beyond the story. Do not refactor unrelated code.

## Step 4 — Build and test

```bash
cd list && npm run build
```

If the build fails, fix the errors before continuing.

Then run the tests:

```bash
cd list && npm test
```

If tests fail:
- Read the failure output carefully
- Fix the root cause (don't work around it)
- Re-run until all tests pass

If the story requires new behaviour not covered by existing tests, write new tests in `list/tests/` following the Playwright patterns already in that directory.

## Step 5 — Review and clean up

Run the `/simplify` skill on the changed files to catch reuse, quality, and efficiency issues. Fix any real problems found.

## Step 6 — Commit

Stage only the files changed for this story:

```bash
git add <specific files only — never git add -A>
git commit -m "feat(list): <short description>

<one or two sentences on what and why>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Use `feat(list):` prefix for new features, `fix(list):` for bug fixes.

After committing, report:
- The story that was implemented
- Files changed
- Test count (pass/fail)
- Any notable design decisions made
