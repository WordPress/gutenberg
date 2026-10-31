---
name: gutenberg-pr-test
description: Use when testing a Gutenberg pull request, branch, or patch for reviewer validation, including checking out a PR, reading its testing instructions, running focused automated checks, manually verifying behavior in wp-env, and reporting test results.
---

# Gutenberg PR Test

Test the PR's stated behavior, not a generic checklist. Prefer focused evidence that a reviewer or committer can use directly.

## Establish scope

1. Read the PR title, description, linked issue, testing instructions, changed-file list, and diff.
2. Identify the user-facing behavior, public API, data contract, or build output the PR claims to change.
3. Read the relevant contributor docs before choosing validation: [Testing Overview](../../docs/contributors/code/testing-overview.md), [End-to-End Testing](../../docs/contributors/code/e2e/README.md), [Git Workflow](../../docs/contributors/code/git-workflow.md), or area-specific docs near the changed files.
4. If the PR has explicit testing instructions, run those first unless they are unsafe, impossible in the current environment, or clearly obsolete.

For a GitHub PR:

```bash
gh pr view <number> --repo WordPress/gutenberg --json title,body,headRefName,baseRefName,files,commits
gh pr checkout <number> --repo WordPress/gutenberg
```

For a local branch:

```bash
git diff origin/trunk...HEAD --stat
git diff origin/trunk...HEAD
```

## Prepare the environment

-   Check repository state with `git status -sb` before changing branches or applying patches.
-   Run `nvm use` if Node commands are needed.
-   Run `npm run wp-env status` before manual editor testing; start it with `npm run wp-env start` only if it is not already running.
-   For PHP or e2e test suites, check `npm run wp-env-test status`; start it with `npm run wp-env-test start` only if needed.
-   Do not use headed Playwright modes (`--headed`, `--ui`, `--debug`) in an unattended agent session.

## Choose focused validation

Use the smallest credible set that proves or disproves the PR's claim:

-   JavaScript unit or integration tests: `npm run test:unit <path_or_package>`.
-   PHP tests: `vendor/bin/phpunit <path_to_test_file.php>` or `composer test` when broad PHP coverage is justified.
-   E2e tests: `npm run test:e2e -- <path_to_spec>`; repeat a changed or flaky spec with `--repeat-each=3` when stability matters.
-   Linting or formatting: run only the checks relevant to changed files unless the PR specifically changes shared tooling.
-   Manual testing: follow the PR steps in wp-env, capture the exact path, browser-visible result, and any console/server errors.

When the PR touches blocks, saved markup, REST responses, public packages, or generated artifacts, verify both the edited source and the runtime or generated output that consumers actually use.

## Handle failures

-   Re-run once only when the failure could plausibly be environmental or flaky.
-   Do not weaken assertions, skip cases, or change production code just to make a validation pass.
-   Separate PR regressions from pre-existing failures by checking the base branch or a nearby unaffected test when the evidence is ambiguous.
-   If setup is blocked, report the exact missing service, dependency, credential, or command output needed to continue.

## Report results

End with concrete evidence:

-   PR or branch tested, base branch, and commit hash.
-   Commands and manual steps run.
-   Pass/fail result for each check.
-   Any deviations from the PR's testing instructions.
-   Clear reproduction details for failures, including screenshots or logs when they materially help.
-   Residual risk: important surfaces you did not test and why.
