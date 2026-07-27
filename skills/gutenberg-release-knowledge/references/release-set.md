# Establish the release set

## Prepare the repository

1. Check the worktree, current branch, remotes, and GitHub authentication.
2. Fetch the upstream default branch and relevant release tags.
3. Refresh a stale fork only to the scope the user authorized. Do not delete unrelated remote branches merely because the default branch is stale.
4. Create a dedicated topic branch from the requested base.

## Resolve the shipped changes

1. Resolve the exact stable tag `v<release>` and the preceding stable Gutenberg tag. When the input omits a patch number, use `v<release>.0`.
2. Extract commits and pull request numbers from the tag range.
3. Cross-check the set against the release milestone and published changelog.
4. Account for backports, release-branch-only commits, and pull requests represented by more than one commit.
5. Keep the release tag and the current default branch distinct. A shipped change may be absent, reverted, or superseded on the current branch.

For each candidate, retain the pull request number, title, author, merge outcome, shipped commit, changed files, relevant discussion links, and release evidence.

## Select candidates

Prioritize discussions that may yield reusable guidance about:

-   package and editor-layer boundaries;
-   public, private, or compatibility APIs;
-   block parsing, serialization, and data contracts;
-   styles and `theme.json` behavior;
-   backward compatibility and version-specific code;
-   recurring implementation or review principles.

Deprioritize routine fixes, copy changes, generated updates, dependency bumps, and one-off implementation details unless their discussion reveals a broader rule.

Use titles, changed paths, labels, authors, and diffs to shortlist candidates before retrieving full conversations. Do not infer architectural guidance from titles alone.
