<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/master/packages#maintaining-changelogs. -->

## Unreleased

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
