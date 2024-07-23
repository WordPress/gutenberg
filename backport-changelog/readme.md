# Core Backport Changelog

If you've changed or added files to the Gutenberg plugin, you'll need to confirm whether the changes are to be backported to [WordPress Core](https://github.com/WordPress/wordpress-develop), and therefore featured in the next release of WordPress.

On open Gutenberg PRs, changes to certain files are flagged as requiring backporting to WordPress Core, for example, PHP files in `/lib` and PHP unit tests. 

These changes must have a corresponding Core PR before they can be merged to Gutenberg trunk.

To create a Core PR, first create a [new Trac ticket](https://core.trac.wordpress.org/newticket) and submit a pull request to the [WordPress Core GitHub repository](https://github.com/WordPress/wordpress-develop).

The Core PR can remain open as long as is required.

For more information on how to create a Core PR, see the [WordPress Core Handbook](https://make.wordpress.org/core/handbook/contribute/git/github-pull-requests-for-code-review/).

## How to add a Core Backport PR to the changelog

After you create Core PR, you'll need to create a corresponding markdown file, and place it within the appropriate release subdirectory.

The filename is the Core PR number.

For example, if your Core PR number is `1234` and is slated to be part of the WordPress 6.9 release, the filename will be `1234.md`, and will be placed in the `/backport-changelog/6.9` directory.

The content of the markdown file should be the Github URL of the Core PR, followed by a list of Gutenberg PR Github URLs whose changes are backported in the Core PR.

A single Core PR may contain changes from one or multiple Gutenberg PRs.

### Examples

Let's say the next WordPress release is 6.9. You have two Gutenberg PRs — `1111` and `2222` — whose changes are backported in a single Core PR, number `1234`.

First you would create a file named `1234.md` in the `/6.9` folder. 

If the `/6.9` folder doesn't exist, create it. 

Then you would add the following content to your new file:

```md
https://github.com/WordPress/wordpress-develop/pull/1234

* https://github.com/WordPress/gutenberg/pull/1111
* https://github.com/WordPress/gutenberg/pull/2222
```

If `1234.md` already exists, you would add the Gutenberg PRs to the list in the existing file.

## Why use individual files?

For the backport changelog, Gutenberg uses individual files as opposed to a single changelog file to avoid rebase conflicts.

## Exceptions

Some Gutenberg PRs may be flagged as needing a core backport PR when they don't, for example when the PR contains minor comment changes, or the changes already exist in Core.

For individual PRs, there are two Github labels that can be used to exclude a PR from the backport changelog CI check:

- `Backport from WordPress Core` - Indicates that the PR is a backport from WordPress Core and doesn't need a Core PR.
- `No Core Sync Required` - Indicates that any changes do not need to be synced to WordPress Core.

If there are specific file or directory changes that should **never** be flagged as requiring a Core backport PR, you can add it to the list of exceptions in [.github/workflows/check-backport-changelog.yml](https://github.com/WordPress/gutenberg/tree/trunk/.github/workflows/check-backport-changelog.yml).

## Where to get help

If you're unsure, you can always ask the Gutenberg Core team for help on the Gutenberg PR `@WordPress/gutenberg-core` or via the #core-editor channel in [WordPress Slack](https://make.wordpress.org/chat/).
