# @wordpress/changelog-tools

Tools for managing package changelogs and fragments using [Changie](https://changie.dev).

## Architecture

-   The root `.changie.yaml` defines repo-wide kinds, formatting templates, and opted-in projects.
-   `lib/config.js`: loads configuration and detects whether a package is configured for Changie.
-   `lib/migrate.js`: bi-directional migration between traditional `CHANGELOG.md` files and Changie version/fragment files.
-   `lib/preview.js`: preview unreleased notes across packages.
-   `lib/release.js`: version bump calculation and batch/merge operations used during automated package publishing.

## Migrating a package to Changie

When onboarding a package to use Changie changelog fragments, follow this process:

### 1. Test migration with dry run

Run the migration script with `--dry-run` to inspect how many released versions and pending unreleased entries will be extracted:

```bash
npm run changelog:migrate -- <package-name> --dry-run
```

Ensure the count matches expectations and there are no parsing errors.

### 2. Execute migration

Run the migration script without the dry-run flag:

```bash
npm run changelog:migrate -- <package-name>
```

This performs three operations:

1.  Extracts all past versions into `.changes/<package-name>/<version>.md`.
2.  Converts any entries currently under `## Unreleased` into individual fragment files under `.changes/unreleased/<PR>__<package-name>__<kind>__<timestamp>.yaml`.
3.  Replaces `packages/<package-name>/CHANGELOG.md` with the standard Changie header and unreleased stub comment.

### 3. Register the package in `.changie.yaml`

Add the package entry to the `projects` list in the root `.changie.yaml`:

```yaml
projects:
  - label: Components
    key: components
  - label: UI
    key: ui
  - label: <Package Title>
    key: <package-name>
```

The `key` must match the package directory name under `packages/`.

### 4. Verify the migration

Confirm the package builds, passes changelog linting, and renders expected outputs:

```bash
# Preview the extracted unreleased notes
npm run changelog:preview -- -p <package-name>

# Test full changelog merge without modifying disk
npm exec --workspace @wordpress/changelog-tools --no -- changie merge --dry-run

# Run repository changelog linter
npm run lint:changelogs
```

### Aborting a migration during development

If something went wrong during local testing or the migration PR is abandoned, discard your local working tree changes rather than using rollback:

```bash
git restore packages/<package-name>/CHANGELOG.md .changie.yaml
git clean -fd .changes/
```

## Reverting a migrated package (Post-merge rollback)

If a package has already been migrated, merged into `trunk`, and maintainers decide to reverse the migration back to traditional manual `CHANGELOG.md` maintenance, follow these steps:

### 1. Run migration rollback

Use the migration script's `--rollback` flag:

```bash
npm run changelog:migrate -- <package-name> --rollback
```

This reconstructs `packages/<package-name>/CHANGELOG.md` by combining all historical version files and pending unreleased fragments, and removes `.changes/<package-name>/` and the package's unreleased fragment files.

### 2. Remove package from `.changie.yaml`

Remove the package from the `projects` list in `.changie.yaml`.

### 3. Verify and commit

Verify the restored changelog formatting:

```bash
npm run lint:changelogs
```

Commit the restored `packages/<package-name>/CHANGELOG.md` and updated `.changie.yaml`.
