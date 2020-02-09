## Master

### Breaking Changes

- `wp-env start` no longer accepts a WordPress branch or tag reference as its argument. Instead, create a `.wp-env.json` file and specify a `"core"` field.
- `wp-env start` will now download WordPress into a hidden directory located in `~/.wp-env`. You may delete your `{projectName}-wordpress` and `{projectName}-tests-wordpress` directories.

### New Feature

- A `.wp-env.json` configuration file can now be used to specify the WordPress installation, plugins, and themes to use in the local development environment.

## 0.4.0 (2020-02-04)

### Bug Fixes

- When running scripts using `wp-env run`, the output will not be formatted if not written to terminal display, resolving an issue where piped or redirected output could be unintentionally padded with newlines.
