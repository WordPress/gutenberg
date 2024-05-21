# Core Backport Changelog

Any PR that makes changes to be backported to [core](https://github.com/WordPress/wordpress-develop) should log a core PR here. It's possible to have multiple Gutenberg PRs link to a single core backport PR. The core backport PR can remain open as long as wanted/needed. The entries are sorted by core release (in folders), and each entry should be an md file with the core PR number as the file name, and the link to the Gutenberg PR in the file content. The file content should start with the core PR URL, followed by a Markdown list of Gutenberg PRs (see example). Files are used to avoid rebase conflicts.

If you think a file path is wrongly flagged as needing a core backport PR, you can add it to the list of exceptions in `.github/workflows/check-backport-changelog.yml`.

## Example

Path: `{wp-release-number-x.x}/{core-pr-number}.md`, e.g. `6.6/1234.md`.
File content:
```md
https://github.com/WordPress/wordpress-develop/pull/{core-pr-number}

* https://github.com/WordPress/gutenberg/pull/{first-gb-pr-number}
* https://github.com/WordPress/gutenberg/pull/{second-gb-pr-number}
```
