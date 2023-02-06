<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 5.11.0 (2023-02-01)

### Bug fix

-   PHP 7.3 and 7.4 must use PHPUnit 9.

### Enhancement

-   It's now possible to run PHPUnit tests on PHP 8.1 and 8.2.

## 5.10.0 (2023-01-11)

## 5.9.0 (2023-01-02)

## 5.8.0 (2022-12-14)

## 5.7.0 (2022-11-16)

## 5.6.0 (2022-11-02)

## 5.5.0 (2022-10-19)

## 5.4.0 (2022-10-05)

## 5.3.0 (2022-09-21)

## 5.2.0 (2022-08-16)

### Enhancement
-   Query parameters can now be used in .zip source URLs.

## 5.1.1 (2022-08-16)

### Bug Fix
-   Fix a crash when "core" was set to `null` in a `.wp-env.json` file. We now use the latest stable WordPress version in that case. This also restores the previous behavior of `"core": null` in `.wp-env.override.json`, which was to use the latest stable WordPress version.

## 5.1.0 (2022-08-10)

### Enhancement
-   Previously, wp-env used the WordPress version provided by Docker in the WordPress image for installations which don't specify a WordPress version. Now, wp-env will find the latest stable version on WordPress.org and check out the https://github.com/WordPress/WordPress repository at the tag matching that version. In most cases, this will match what Docker provides. The benefit is that wp-env (and WordPress.org) now controls the default WordPress version rather than Docker.

### Bug Fix
-   Downloading a default WordPress version also resolves a bug where the wrong WordPress test files were used if no core source was specified in wp-env.json. The current trunk test files were downloaded rather than the stable version. Now, the test files will match the default stable version.

## 5.0.0 (2022-07-27)

### Breaking Changes
-   Removed the `WP_PHPUNIT__TESTS_CONFIG` environment variable from the `phpunit` container. **This removes automatic support for the `wp-phpunit/wp-phpunit` Composer package. To continue using the package, set the following two environment variables in your `phpunit.xml` file or similar: `WP_TESTS_DIR=""` and `WP_PHPUNIT__TESTS_CONFIG="/wordpress-phpunit/wp-tests-config.php"`.**
-   Removed the generated `/var/www/html/phpunit-wp-config.php` file from the environment.

### Enhancement
-   Read WordPress' version and include the corresponding PHPUnit test files in the environment.
-   Set the `WP_TESTS_DIR` environment variable in all containers to point at the PHPUnit test files.

### Bug Fix
-   Restrict `WP_TESTS_DOMAIN` constant to just hostname rather than an entire URL (e.g. it now excludes scheme, port, etc.) ([#41039](https://github.com/WordPress/gutenberg/pull/41039)).

## 4.8.0 (2022-06-01)

### Enhancement
-   Removed the need for quotation marks when passing options to `wp-env run`.
-   Setting a `config` key to `null` will prevent adding the constant to `wp-config.php` even if a default value is defined by `wp-env`.

## 4.7.0 (2022-05-18)

### Enhancement
-   Added SSH protocol support for git sources

## 4.2.0 (2022-01-27)

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
