## Master

## 1.1.0 (2020-04-01)

### New Feature

-   URLs for ZIP files are now supported as core, plugin, and theme sources.
-   The `.wp-env.json` coniguration file now accepts a `config` object for setting `wp-config.php` values.
-   A `.wp-env.override.json` configuration file can now be used to override fields from `.wp-env.json`.
-   You may now override the directory in which `wp-env` creates generated files with the `WP_ENV_HOME` environment variable. The default directory is `~/.wp-env/` (or `~/wp-env/` on Linux).
-   The `.wp-env.json` coniguration file now accepts `port` and `testsPort` options which can be used to set the ports on which the docker instance is mounted.

## 1.0.0 (2020-02-10)

### Breaking Changes

-   `wp-env start` no longer accepts a WordPress branch or tag reference as its argument. Instead, create a `.wp-env.json` file and specify a `"core"` field.
-   `wp-env start` will now download WordPress into a hidden directory located in `~/.wp-env`. You may delete your `{projectName}-wordpress` and `{projectName}-tests-wordpress` directories.

### New Feature

-   A `.wp-env.json` configuration file can now be used to specify the WordPress installation, plugins, and themes to use in the local development environment.

## 0.4.0 (2020-02-04)

### Bug Fixes

-   When running scripts using `wp-env run`, the output will not be formatted if not written to terminal display, resolving an issue where piped or redirected output could be unintentionally padded with newlines.
