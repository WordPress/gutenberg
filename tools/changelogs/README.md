# @wordpress/changelog-tools

Tools for managing package changelogs and fragments using [Changie](https://changie.dev).

## Architecture

- The root `.changie.yaml` defines repo-wide kinds, formatting templates, and opted-in projects.
- `lib/config.js`: loads configuration and detects whether a package is configured for Changie.
- `lib/migrate.js`: bi-directional migration between traditional `CHANGELOG.md` files and Changie version/fragment files.
- `lib/preview.js`: preview unreleased notes across packages.
