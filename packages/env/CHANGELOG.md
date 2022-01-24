<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancement
-   Added command `wp-env install-path` to list the directory used for the environment.
-   The help entry is now shown when no subcommand is passed to `wp-env`.

### Bug Fix
-   Updated `yargs` to fix [CVE-2021-3807](https://nvd.nist.gov/vuln/detail/CVE-2021-3807).

## 4.1.3 (2021-11-07)

### Bug Fix

-   Fix Xdebug installation code to ensure it would fail gracefully

## 4.0.3 (2021-04-29)

### Bug Fix

-   `wp-env destroy` will now work in environments which don't include the `grep` or `awk` commands, such as Windows PowerShell.
-   Fix several permissions issues related to wp-config.php and wp-content files.
-   Fix crash which happened when the path to wp-env's home directory contained a space.
-   Disable Xdebug 3 for PHP versions less than 7.2 to resolve startup crash.

## 4.0.0 (2021-03-17)

### Breaking Change

-   Migrate from `nodegit` to `simple-git`. This change now requires you to have a `git` binary installed locally to utilize the git sources feature of wp-env.json.

### Bug Fixes

-   "mappings" sources are now downloaded if they contain non-local sources.

## 3.0.0 (2020-12-17)

### Breaking Changes

-   `wp-env start` is now the only command which writes to the docker configuration files. Previously, running any command would also parse the config and then write it to the correct location. Now, other commands still parse the config, but they will not overwrite the confugiration which was set by wp-env start. This allows parameters to be passed to wp-env start which can affect the configuration.

### Enhancement

-   Update nodegit dependency to 0.27.0, the earlier version does not have pre-built binaries for Node 14.15.0 LTS. Upgrading provides support without requiring building nodegit locally.
-   Allow WP_HOME wp-config value to be set to a custom port other than the default for the docker instance.
-   Append the instance URL to output of `wp-env start`.

### New feature

-   Add support for setting the PHP version used for the WordPress instance. For example, test PHP 8 with `"phpVersion": 8.0` in wp-env.json.
-   Add Xdebug 3 to the development environment. You can enable Xdebug with `wp-env start --xdebug` (for debug mode) or `wp-env start --xdebug=develop,coverage` for custom modes.

### Bug Fixes

-   ZIP-based plugin sources are now downloaded to a directory using the basename of the URL instead of the full URL path. This prevents HTML encoded characters in the URL (like "/") from being improperly encoded into the filesystem. This fixes the issue where many .zip sources broke because files with these badly formatted characters were not loaded as assets.

## 2.0.0 (2020-09-03)

### Breaking Changes

-   The `config` and `mappings` options in `.wp-env.json` are now merged with any overrides instead of being overwritten.
-   The first listed theme is no longer activated when running wp-env start, since this overwrote whatever theme the user manually activated.
-   `wp-env start` no longer stops the WordPress instance if it was already started unless it needs to configure WordPress.
-   `wp-env start` no longer updates remote sources after first install if the configuration is the same. Use `wp-env start --update` to update sources.

### New Feature

-   You may now specify specific configuration for different environments using `env.tests` or `env.development` in `.wp-env.json`.
-   `wp-env start` is significantly faster after first install.

## 1.6.0-rc.0 (2020-06-24)

### Bug Fixes

-   `wp-env destroy` now removes dangling docker volumes and networks associated with the WordPress environment.

## 1.4.0 (2020-05-28)

### New Feature

-   Add support for running interactive commands. Examples: `wp-env run cli wp shell` and `wp-env run cli bash`.
-   View php and WordPress log output with the new `wp-env logs` command.
-   Clean up your local environment with the new `wp-env destroy` command.
-   Expose Docker service for running phpunit commands.
-   You may now mount local directories to any location within the WordPress install. For example, you may specify `"wp-content/mu-plugins": "./path/to/mu-plugins"` to add mu-plugins.

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
