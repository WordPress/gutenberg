## Managing tasks

Tasks are tracked as GitHub Issues on WordPress/gutenberg.
Use `gh issue view <num>`, `gh issue create`, `gh issue list` via Bash.
Link the related issue in the pipeline prompt and PR body.

## Pipeline slugs

Format: `<issue-number>-<kebab-case-noun-phrase>`.
If no related issue exists, drop the prefix and use the kebab phrase alone.
Example: `49843-wp-env-default-port-fallback`.

## Worktrees

Use Claude Code's EnterWorktree tool for every pipeline.
The tool creates an isolated git worktree on a fresh branch and auto-cleans on ExitWorktree if no changes landed.
Do not use raw `git worktree`.

## Branch names

Format: `try/<pipeline-slug>`.
Created via EnterWorktree at pipeline start. EnterWorktree's default branch name does not match this convention; rename with `git branch -m` immediately after entering the worktree.

## Pipeline artifact folders

Path: `.pipelines/<pipeline-slug>/`.
Committed inside the pipeline branch so artifacts are inspectable by reviewers and downstream phases.
Maintainers may remove the folder before squash-merging if it should not land on trunk.

## Spawning teams of agents

Use Claude Code's Agent tool. One Agent call per role.
Map radical-pipelines roles to subagent_type:
- spec-writer, plan-writer, implementer, doc-writer => general-purpose
- spec-reviewer, plan-reviewer, implementer-reviewer, doc-reviewer => general-purpose with adversarial-review prompt
- exploratory research within a phase => Explore
- architecture planning => Plan
Pass: pipeline slug, artifact folder, exact artifact paths to read/write, role-specific conventions, review iteration N for reviewers.
Launch independent agents in parallel (single message, multiple Agent blocks).

## Commits

Conventional Commits. Subject <= 72 chars.
Scope = top-level package or area: `feat(env): ...`, `fix(block-editor): ...`, `docs(env): ...`, `test(env): ...`.
Body only when 'why' is non-obvious.
Always include trailer:
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
Do not amend; create new commits when hooks fail.
