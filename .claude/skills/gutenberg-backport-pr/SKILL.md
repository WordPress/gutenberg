---
name: gutenberg-backport-pr
description: This skill should be used when the user asks to "create a backport PR", "backport to wordpress-develop", "backport to WP core", "backport this Gutenberg PR", or "add a backport-changelog entry". Handles the workflow of mirroring PHP changes from a Gutenberg PR into WordPress/wordpress-develop.
---

# Gutenberg → WordPress Core backport PR

Mirror the PHP changes from a merged Gutenberg PR into a `WordPress/wordpress-develop` pull request, then add the matching `backport-changelog` entry to the Gutenberg PR.

## Reference

The full procedure lives at [`docs/contributors/code/back-merging-to-wp-core.md`](../../../docs/contributors/code/back-merging-to-wp-core.md). Read it before starting. It covers:

- Which files require backporting and which are excluded
- Path mapping rules (direct-sync, compat shims, class renames, aggregators, tests)
- Trac ticket requirements
- wordpress-develop PR conventions
- How to add the `backport-changelog` entry

The changelog file format is documented at [`backport-changelog/readme.md`](../../../backport-changelog/readme.md).

## Before starting

Check the Gutenberg PR labels first. If any of these are set, no back-merge is needed and the workflow can stop:

- `Backport from WordPress Core`
- `Backported to WordPress Core`
- `No Core Sync Required`

Then confirm with the user:

- The target WordPress version (sets the `backport-changelog/<version>/` directory)
- The Trac ticket number (reuse an existing one where possible)

## Approach

Either work from a local clone of `wordpress-develop`, or use the `gh` CLI to prepare the branch and PR on a fork via the GitHub API. The local-clone path is simpler when the checkout already exists; the API path avoids any local setup.

For files that map mechanically (direct-sync, test filename stripping), copy the content across. For compat shims and aggregator files, apply the diff to the existing WP Core file rather than copying the shim wholesale.

Run PHPCS on the proposed files before pushing (`vendor/bin/phpcs <file>`; `vendor/bin/phpcbf` for auto-fixable issues). wordpress-develop CI will otherwise fail the PR.

Open the wordpress-develop PR as a draft until the Trac ticket is filled in and the diff has been reviewed.

## After the wordpress-develop PR is open

Commit the `backport-changelog/<wp-version>/<wp-develop-pr-number>.md` file to the Gutenberg PR's branch. This unblocks the "Verify Core Backport Changelog" CI check.
