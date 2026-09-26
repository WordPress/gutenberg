# Back-merging code to WordPress Core

For major releases of the WordPress software, Gutenberg features need to be merged into WordPress Core. Typically this involves taking changes made in `.php` files within the Gutenberg repository and making the equivalent updates in the WP Core codebase.

## Criteria

### Files/Directories

Changes to files within the following files/directories will typically require back-merging to WP Core:

-   `lib/`
-   `phpunit/`

### Ignored directories/files

The following directories/files do _not_ require back-merging to WP Core:

-   `lib/load.php` - Plugin specific code.
-   `lib/experiments-page.php` - experiments are Plugin specific.
-   `packages/block-library` - this is handled automatically during the packages sync process.
-   `packages/e2e-tests/plugins` - PHP files related to e2e tests only. Mostly fixture data generators.
-   `phpunit/blocks` - the code is maintained in Gutenberg so the test should be as well.

Please note this list is not exhaustive.

### Pull Request Criteria

In general, all PHP code committed to the Gutenberg repository since the date of the final Gutenberg release that was included in [the _last_ stable WP Core release](https://developer.wordpress.org/block-editor/contributors/versions-in-wordpress/) should be considered for back merging to WP Core.

There are however certain exceptions to that rule. PRs with the following criteria do _not_ require back-merging to WP Core:

-   Does not contain changes to PHP code.
-   Has label `Backport from WordPress Core` - this code is already in WP Core and is being synchronized back to Gutenberg.
-   Has label `Backported to WordPress Core` - this code has already been synchronized to WP Core.
-   Has label `No Core Sync Required` - the changes do not need to be synced to WP Core.

## How to back-merge a PR

The back-merge itself is a pull request against [`WordPress/wordpress-develop`](https://github.com/WordPress/wordpress-develop) that mirrors the PHP changes from the Gutenberg PR. This can be prepared from a local checkout, or by using the GitHub API from your own fork of `wordpress-develop`.

### 1. Identify the files to back-merge

Fetch the changed files from the Gutenberg PR and filter for the paths listed under [Criteria](#criteria) above. Skip anything that matches the ignored files/directories.

### 2. Map each Gutenberg path to a WP Core path

Most files fall into one of these patterns:

**Direct-sync files** — kept byte-for-byte identical to their WP Core counterparts. Copy the file across.

|  Gutenberg | wordpress-develop |
| --- | --- |
| `lib/<subpath>/*.php` | `src/wp-includes/<subpath>/*.php` |

For example, `lib/block-supports/layout.php` maps to `src/wp-includes/block-supports/layout.php`.

**Compat shim files** — files under `lib/compat/wordpress-X.Y/` contain compatibility shims for older WordPress versions. Do not copy the whole file. Instead, port the relevant change into the equivalent WP Core file (often under `src/wp-includes/`):

|  Gutenberg | wordpress-develop |
| --- | --- |
| `lib/compat/wordpress-X.Y/<filename>` | `src/wp-includes/<filename>` (common case) |

The destination sometimes lives in a subdirectory that isn't reflected in the Gutenberg path. Search WP Core for the file or class name to locate it.

**Class files with `-gutenberg` in the name** — strip the Gutenberg-specific naming when translating:

|  Gutenberg | wordpress-develop |
| --- | --- |
| `lib/class-wp-<name>-gutenberg.php` | `src/wp-includes/class-wp-<name>.php` |
| `lib/media/class-gutenberg-rest-<name>.php` | `src/wp-includes/rest-api/endpoints/class-wp-rest-<name>.php` |

**Aggregator files** — files like `lib/media/load.php` have no direct WP Core counterpart. Each change fans out to the appropriate WP Core file (a filter added on `admin_init` may land in `src/wp-includes/default-filters.php`, a function body change in `src/wp-includes/media.php`, and so on). Read the diff and apply each piece where it belongs.

**PHP unit tests**:

|  Gutenberg | wordpress-develop |
| --- | --- |
| `phpunit/<subpath>/<name>-test.php` | `tests/phpunit/tests/<subpath>/<name>.php` |

Strip the `-test` suffix. Class-based test files (`class-wp-<name>-test.php`) may land in a different subdirectory than their Gutenberg location; search WP Core by class name.

### 3. Find the appropriate Trac ticket

Every WP Core PR must reference a [Trac ticket](https://core.trac.wordpress.org/). Reuse an existing ticket if one applies, or create one before opening the PR.

### 4. Open the wordpress-develop PR

Push the changes to a branch on your fork of `wordpress-develop` and open a pull request against `trunk`. A common naming convention is:

-   Branch: `backport/<gutenberg-pr-number>-<short-description>`
-   Title: `<Component>: <Description> (backport GB #<gutenberg-pr-number>)`

The PR body should reference the Gutenberg PR and the Trac ticket. See existing examples such as [WordPress/wordpress-develop#12324](https://github.com/WordPress/wordpress-develop/pull/12324) or [WordPress/wordpress-develop#12516](https://github.com/WordPress/wordpress-develop/pull/12516).

### 5. Add a backport-changelog entry

After the wordpress-develop PR is open, add a corresponding markdown file to the Gutenberg PR at `backport-changelog/<wp-version>/<wp-develop-pr-number>.md`. See [backport-changelog/readme.md](https://github.com/WordPress/gutenberg/blob/trunk/backport-changelog/readme.md) for the exact format. The CI check on the Gutenberg PR will fail until this file exists (or a skip label is applied).

## Further Reading

Please see also additional documentation regarding [Gutenberg PHP code](/lib/README.md).
