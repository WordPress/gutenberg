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

## Further Reading

Please see also additional documentation regarding [Gutenberg PHP code](/lib/README.md).
