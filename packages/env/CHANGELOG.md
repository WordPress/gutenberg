<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Add experimental WordPress Playground runtime support. Use `--runtime=playground` flag to start wp-env with Playground instead of Docker.

## 10.38.0 (2026-01-16)

## 10.36.0 (2025-11-26)

## 10.35.0 (2025-11-12)

## 10.34.0 (2025-10-29)

## 10.33.0 (2025-10-17)

## 10.32.0 (2025-10-01)

## 10.31.0 (2025-09-17)

## 10.30.0 (2025-09-03)

## 10.29.0 (2025-08-20)

## 10.28.0 (2025-08-07)

## 10.27.0 (2025-07-23)

### Enhancements

-   Add config file for WP-CLI when creating an environment. ([#70661](https://github.com/WordPress/gutenberg/pull/70661)).

## 10.26.0 (2025-06-25)

## 10.25.0 (2025-06-04)

## 10.24.0 (2025-05-22)

## 10.23.0 (2025-05-07)

## 10.22.0 (2025-04-11)

## 10.21.0 (2025-03-27)

## 10.20.0 (2025-03-13)

## 10.19.0 (2025-02-28)

## 10.18.0 (2025-02-12)

## 10.17.0 (2025-01-29)

### Enhancements

-   Add a `WP_ENV_MULTISITE` environment variable to override the `multisite` option ([#68792](https://github.com/WordPress/gutenberg/pull/68792)).

## 10.16.0 (2025-01-15)

## 10.15.0 (2025-01-02)

### Enhancements

-   Add support for WordPress multisite installations. Enabled via the new `multisite` environment config ([#67845](https://github.com/WordPress/gutenberg/pull/67845)).

### Internal

-   Refactored the code to use new API introduced together with `@inquirer/prompts` instead of legacy `inquirer` package ([#67877](https://github.com/WordPress/gutenberg/pull/67877)).

## 10.14.0 (2024-12-11)

### Enhancements

-   Add phpMyAdmin as an optional service. Enabled via the new `phpmyadminPort` environment config, as well as env vars `WP_ENV_PHPMYADMIN_PORT` and `WP_ENV_TESTS_PHPMYADMIN_PORT` ([#67588](https://github.com/WordPress/gutenberg/pull/67588)).

### Internal

-   The bundled `rimraf` dependency has been updated from `^3.0.2` to `^5.0.10` ([#67708](https://github.com/WordPress/gutenberg/pull/67708)).

## 10.13.0 (2024-11-27)

## 10.12.0 (2024-11-16)

## 10.11.0 (2024-10-30)

## 10.10.0 (2024-10-16)

## 10.9.0 (2024-10-03)

## 10.8.0 (2024-09-19)

### Enhancements

-   Add SPX profiling support via new `--spx` flag on `wp-env start` command ([#65187](https://github.com/WordPress/gutenberg/pull/65187)).

## 10.7.0 (2024-09-05)

## 10.6.0 (2024-08-21)

### Enhancements

-   Expose the `my_sql_port` option in `.wp-env.json`, as well as via env vars `WP_ENV_MYSQL_PORT` and `WP_ENV_TESTS_MYSQL_PORT` ([#64353](https://github.com/WordPress/gutenberg/pull/64353)).

## 10.5.0 (2024-08-07)

## 10.4.0 (2024-07-24)

### Enhancements

-   The bundled Docker image now includes LDAP support ([#63519](https://github.com/WordPress/gutenberg/pull/63519)).

## 10.3.0 (2024-07-10)

## 10.2.0 (2024-06-26)

### Bug Fixes

-   Use `mariadb` instead of `mysql` for `arm64` platforms ([#62073](https://github.com/WordPress/gutenberg/pull/62073)).

## 10.1.0 (2024-06-15)

## 10.0.0 (2024-05-31)

### Breaking Changes

-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#64934](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 9.8.0 (2024-05-16)

### Bug Fixes

-   Resolve issue with plugins not showing up in Playground ([#61730](https://github.com/WordPress/gutenberg/pull/61730))

### Internal

-   Replaced `chalk` with `picocolors` ([#61325](https://github.com/WordPress/gutenberg/pull/61325)).

## 9.7.0 (2024-05-02)

## 9.6.0 (2024-04-19)

### Bug Fixes

-   Add `bcmath` extension to Docker image ([#60073](https://github.com/WordPress/gutenberg/pull/60073)).

### Internal

-   The bundled `inquirer` dependency has been replaced with `@inquirer/prompts` ([#60827](https://github.com/WordPress/gutenberg/pull/60827)).

## 9.5.0 (2024-04-03)

## 9.4.0 (2024-03-21)

## 9.3.0 (2024-03-06)

## 9.2.0 (2024-02-21)

### Bug Fixes

-   Handles directory removal after `wp-env destroy` is run on a folder that no longer exists on Windows ([#58770](https://github.com/WordPress/gutenberg/pull/58770)).

## 9.1.0 (2024-02-09)

## 9.0.0 (2024-01-24)

### Breaking Changes

-   Remove previously deprecated `WP_PHPUNIT__TESTS_CONFIG` which has been replaced by `WP_TESTS_CONFIG_FILE_PATH` ([#57932](https://github.com/WordPress/gutenberg/pull/57932)).

## 8.13.0 (2024-01-10)

## 8.12.0 (2023-12-13)

### Bug Fixes

-   Fixed the `run` command failing on Windows with the error `env: 'bash\r': No such file or directory` ([#56574](https://github.com/WordPress/gutenberg/pull/56574)).

## 8.11.0 (2023-11-29)

## 8.10.0 (2023-11-16)

### Bug Fixes

-   Run test commands with `TMPDIR` variable set to `WP_TESTS_DIR` value to resolve `file_exists` issues when `open_basedir` is enabled. ([#55837](https://github.com/WordPress/gutenberg/pull/55837)).

## 8.9.0 (2023-11-02)

## 8.8.0 (2023-10-18)

## 8.7.0 (2023-10-05)

## 8.6.0 (2023-09-20)

### Enhancements

-   Add afterSetup lifecycle script. ([#54433](https://github.com/WordPress/gutenberg/pull/54433))
-   Add afterStart lifecycle script. ([#54445](https://github.com/WordPress/gutenberg/pull/54445))
-   Add afterClean lifecycle script. ([#54472](https://github.com/WordPress/gutenberg/pull/54472))
-   Add afterDestroy lifecycle script. ([#54466](https://github.com/WordPress/gutenberg/pull/54466))

### Bug Fixes

-   Fix local config overriding just `port` or `testsPort` fields causing the environment to error during creation ([#54477](https://github.com/WordPress/gutenberg/pull/54477)).

## 8.5.0 (2023-08-31)

## 8.4.0 (2023-08-16)

## 8.3.0 (2023-08-10)

### Enhancements

-   Removed prompt shown after destroying environment. ([#52582](https://github.com/WordPress/gutenberg/pull/52582))

### New Features

-   Add install-path command. ([#52696](https://github.com/WordPress/gutenberg/pull/52696))

## 8.2.0 (2023-07-20)

### Enhancements

-   Updated container image to include Composer ([#52083](https://github.com/WordPress/gutenberg/pull/52083))
-   Removed the composer and phpunit containers. Commands for these are now run on the CLI container. ([#52083](https://github.com/WordPress/gutenberg/pull/52083))

### Bug Fixes

-   Updated container image for the cli container to run the same PHP version as WordPress. ([#52083](https://github.com/WordPress/gutenberg/pull/52083))

## 8.1.0 (2023-07-05)

### Bug Fixes

-   Update `download` function to resolve `wp-env` parallel test issues. ([#51498](https://github.com/WordPress/gutenberg/pull/51498))

## 8.0.0 (2023-06-23)

### Breaking Changes

-   Drop support for Node.js versions 14 and 16. ([#50824](https://github.com/WordPress/gutenberg/pull/50824))
-   Use execute-commands.php script instead of `-e` flag for running wp-cli commands. ([#50824](https://github.com/WordPress/gutenberg/pull/50824))

### Enhancements

-   Update WordPress Docker image to support Xdebug 3.2.1. ([#50823](https://github.com/WordPress/gutenberg/pull/50823))
-   Install suggest PHP extensions (imagick and pdo-mysql). ([#50894](https://github.com/WordPress/gutenberg/pull/50894))
-   Fix issue where Xdebug was running even without `--xdebug` flag. ([#51162](https://github.com/WordPress/gutenberg/pull/51162))

### New Features

-   Add logs command. ([#50643](https://github.com/WordPress/gutenberg/pull/50643))

## 7.1.0 (2023-06-07)

### Enhancements

-   Update WordPress Docker image to support Xdebug 3.2.1. ([#50823](https://github.com/WordPress/gutenberg/pull/50823))
-   Install suggest PHP extensions (imagick and pdo-mysql). ([#50894](https://github.com/WordPress/gutenberg/pull/50894))

## 7.0.0 (2023-05-24)

### Breaking Changes

-   Drop support for Node 14 ([#50727](https://github.com/WordPress/gutenberg/pull/50727)).

## 6.1.0 (2023-05-10)

### Enhancements

-   Add the `WP_DEVELOPMENT_MODE` variable ([#49493](https://github.com/WordPress/gutenberg/pull/49493))
-   Replaced `got` with `node-fetch` ([#49545](https://github.com/WordPress/gutenberg/pull/49545))

### Bug Fixes

-   Add password character escaping ([#49992](https://github.com/WordPress/gutenberg/pull/49992))

### New Features

-   Add commands to the `run` command ([#48303](https://github.com/WordPress/gutenberg/pull/48303))

## 6.0.0 (2023-04-26)

### Breaking Changes

-   Add an `ssh` type for WordPress source "type" strings ([#48303](https://github.com/WordPress/gutenberg/pull/48303))

### Bug Fixes

-   Add a required `config` value for override files ([#49867](https://github.com/WordPress/gutenberg/pull/49867))

## 5.16.0 (2023-04-12)

## 5.15.0 (2023-03-29)

## 5.14.0 (2023-03-15)

### Enhancements

-   The bundled `inquirer` dependency has been updated from requiring `^7.1.0` to requiring `^8.2.5` ([#48239](https://github.com/WordPress/gutenberg/pull/48239)).
-   The bundled `simple-git` dependency has been updated from requiring `^3.5.0` to requiring `^3.16.0` ([#48239](https://github.com/WordPress/gutenberg/pull/48239)).
-   Experimental: Add Playground support to `wp-env destroy` ([#47865](https://github.com/WordPress/gutenberg/pull/47865)).

## 5.13.0 (2023-03-01)

### Enhancements

-   Added the `wordpress-develop` source type, which installs the developer build of WordPress ([#47309](https://github.com/WordPress/gutenberg/pull/47309)).
-   Experimental: Make Playground the default environment for `wp-env start` ([#47309](https://github.com/WordPress/gutenberg/pull/47309)).

## 5.12.0 (2023-02-15)

### Enhancements

-   The bundled `ora` dependency has been updated from requiring `^4.0.2` to requiring `^5.4.1` ([#47703](https://github.com/WordPress/gutenberg/pull/47703)).
-   The bundled `copy-dir` dependency has been updated from requiring `^1.2.0` to requiring `^1.3.0` ([#47703](https://github.com/WordPress/gutenberg/pull/47703)).
-   The bundled `docker-compose` dependency has been updated from requiring `^0.23.4` to requiring `^0.24.0` ([#47703](https://github.com/WordPress/gutenberg/pull/47703)).
-   Added a Playwright test for Playground ([#47685](https://github.com/WordPress/gutenberg/pull/47685)).

## 5.11.0 (2023-02-01)

## 5.10.0 (2023-01-11)

## 5.9.0 (2023-01-02)

## 5.8.0 (2022-12-14)

## 5.7.0 (2022-11-16)

### Bug Fixes

-   Do not crash when detecting the default user. ([#45508](https://github.com/WordPress/gutenberg/pull/45508))
-   Do not crash when sourcing a different branch of a Git repository that had previously been checked out. ([#45721](https://github.com/WordPress/gutenberg/pull/45721))

## 5.6.0 (2022-11-02)

### Enhancements

-   `wp-env` now prints the container's name when running a command using `run`. ([#44890](https://github.com/WordPress/gutenberg/pull/44890))

### Bug Fixes

-   Error messages from `run` commands are now properly showing in the output. ([#44890](https://github.com/WordPress/gutenberg/pull/44890))

## 5.5.0 (2022-10-19)

## 5.4.0 (2022-10-05)

### Enhancements

-   Add a `testsPath` option to config, allowing users to set the /wordpress-phpunit directory of the tests container. ([#44296](https://github.com/WordPress/gutenberg/pull/44296))
-   The docker-compose project is now named after the directory containing the config file or the working directory. Existing containers will be recreated with their new names. ([#43591](https://github.com/WordPress/gutenberg/pull/43591))

### Bug Fixes

-   Do not create the `wordpress-phpunit` directory until we know we need it. This prevents the directory appearing in the wp-content mount. ([#44296](https://github.com/WordPress/gutenberg/pull/44296))

## 5.3.0 (2022-09-21)

### Bug Fixes

-   Ensure consistent config file values for unique downloads. ([#43584](https://github.com/WordPress/gutenberg/pull/43584))
-   Always build the WordPress images before starting the containers. ([#44235](https://github.com/WordPress/gutenberg/pull/44235))

## 5.2.0 (2022-09-13)

### Enhancements

-   Suppress npm version check when launching wp-env. ([#43604](https://github.com/WordPress/gutenberg/pull/43604))
-   CLI container is now created on start rather than on run. ([#43591](https://github.com/WordPress/gutenberg/pull/43591))
-   CLI commands are now run using the exec command, rather than the run command. ([#43591](https://github.com/WordPress/gutenberg/pull/43591))
-   Provide host user permissions in the CLI container. ([#43591](https://github.com/WordPress/gutenberg/pull/43591))

### Bug Fixes

-   Fixed the default `.htaccess` rules so that the REST API works correctly. ([#43590](https://github.com/WordPress/gutenberg/pull/43590))

## 5.1.0 (2022-08-24)

### Enhancements

-   Use the `wordpress:cli` image for PHP commands in the CLI container. ([#42657](https://github.com/WordPress/gutenberg/pull/42657))
-   Extend the `run` command to support any container. ([#42657](https://github.com/WordPress/gutenberg/pull/42657))
-   Allow passing through any WP-CLI options to the `run` command. ([#40044](https://github.com/WordPress/gutenberg/pull/40044))
-   Fix `run` command on Windows. ([#40044](https://github.com/WordPress/gutenberg/pull/40044))

### Bug Fixes

-   Fix error during `stop` when containers are already stopped. ([#43424](https://github.com/WordPress/gutenberg/pull/43424))

## 5.0.0 (2022-08-10)

### Breaking Changes

-   Removed the `phpunit` and `composer` containers. They are no longer required since their commands are already available in the WordPress CLI container. ([#42657](https://github.com/WordPress/gutenberg/pull/42657))

## 4.8.0 (2022-06-15)

### Bug Fixes

-   Removed the 8000 byte limit on the content in the error message about parsing the config file. ([#41484](https://github.com/WordPress/gutenberg/pull/41484))

## 4.7.0 (2022-06-01)

### Bug Fixes

-   Resolved an issue where specific versions of WordPress could not be located by `wp-env` due to new hosting rules ([#41054](https://github.com/WordPress/gutenberg/pull/41054)).

## 4.6.0 (2022-05-18)

## 4.5.0 (2022-05-04)

### Bug Fixes

-   Fix `wp-env` not working on macOS with `localhost` ([#40601](https://github.com/WordPress/gutenberg/pull/40601)).

## 4.4.0 (2022-04-21)

### Enhancement

-   Support `WP_HOME` and `WP_SITEURL` having different values in the `config` option.
