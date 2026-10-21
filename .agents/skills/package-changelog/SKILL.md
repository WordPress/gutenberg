---
name: package-changelog
description: Use when adding, consolidating, or reviewing changelog entries for Gutenberg packages across both Changie fragments and traditional CHANGELOG.md files. Triggered when the user asks to add or prepare changelogs for a PR/branch, or when preparing final PR submission once code and PR number are established.
---

# Package changelogs

Guidance and best practices for creating and maintaining package changelog entries.

## When to add changelog entries

- **Only when work is complete**: Do not generate changelog entries early in task exploration or while code is actively evolving. Wait until implementation is stabilized and ready for review or PR submission.
- **Only when the PR number is known**: Every package changelog entry requires a numeric Gutenberg pull request link.
  - **Never invent, guess, or hallucinate a PR number** (e.g. do not use `#00000` or random digits).
  - If the PR number is unknown (e.g. working on a local branch before opening a PR), **stop and ask the user** for the PR number, or ask if they prefer to create the changelog entry after the PR is opened.
- **Consolidate entries**: Combine related changes into a single consumer-focused entry that describes the public impact, rather than creating an entry for each internal commit or touched component.
- **Verify consumer impact**: Purely internal refactors, test additions, or documentation do not strictly require changelog entries unless requested or impactful to package consumers.

## Discovering the package format

Do not assume which workflow a package uses:

1. **Check if the package uses Changie fragments**:
   - Inspect `.changie.yaml` at the repository root under `projects`.
   - Check if the target package's changelog path (e.g. `changelog: packages/<pkg>/CHANGELOG.md`) is listed.
   - If listed: the package uses **Changie fragments**.
   - If not listed: the package uses **traditional `CHANGELOG.md`** files.

2. **Discover valid `<Kind>` categories**:
   - Read `kinds` in `.changie.yaml` to inspect the allowed `label` values.
   - The category must match one of the configured `label` strings exactly.
   - **Do not invent custom kinds.** Always pick an exact label defined in `.changie.yaml`.

## Creating entries

### For packages using Changie fragments

Do not edit `packages/<package>/CHANGELOG.md` directly.

Create a fragment using non-interactive flags:
```bash
npm run changelog:add -- -j <package> -k "<Kind>" -m "PR=<PR>" -b "<Description>"
```

Or write a fragment file directly at `.changes/unreleased/<PR>__<package>__<kind>.yaml`:
```yaml
project: <package>
kind: <Kind>
body: <Description>
time: '<ISO-Timestamp>'
custom:
  PR: '<PR>'
```

If multiple entries exist for the same PR, package, and kind, append a numeric suffix: `__2.yaml`, `__3.yaml`, etc.

### For packages using traditional CHANGELOG.md

Add the entry under `## Unreleased` under the matching `### <Kind>` subheading in `packages/<package>/CHANGELOG.md`:
```markdown
-   <Description> ([#<PR>](https://github.com/WordPress/gutenberg/pull/<PR>)).
```

Keep entries in a subsection on consecutive lines without blank lines between bullets.

## Modifying or removing existing entries

When updating an entry based on review feedback, revisions, or implementation changes:

### For Changie packages

- **Do not add a duplicate fragment**: Do not run `npm run changelog:add` if an entry for this PR and package already exists.
- **Locate the existing fragment**: Look in `.changes/unreleased/` for files matching `<PR>__<package>__*.yaml`.
- **Edit the YAML file directly**:
  - Update `body` to refine or expand the description.
  - Update `kind` if reclassifying the change (must match an exact `label` from `.changie.yaml`).
- **To remove an entry**: Delete the fragment file directly from `.changes/unreleased/`.
- **Do not edit `packages/<package>/CHANGELOG.md` directly**.

### For traditional packages

- Locate the entry citing `[#<PR>](...)` under `## Unreleased` in `packages/<package>/CHANGELOG.md`.
- Edit the bullet line in place, or move it under the appropriate `### <Kind>` subheading if reclassifying.
- If removing an entry, delete the bullet line. Ensure no blank lines remain between remaining bullets in that subsection.

## Verification

- Preview Changie entries:
  ```bash
  npm run changelog:preview -- -p <package>
  ```
- Validate changelog structure and PR citation:
  ```bash
  npm run lint:changelogs -- --require-pr="<PR>" packages/<package>/CHANGELOG.md
  ```
