# @wordpress/changelog-tools

Tools for managing package changelogs and fragments using [Changie](https://changie.dev).

## Architecture

-   The root `.changie.yaml` defines repo-wide kinds, formatting templates, and opted-in projects.
-   `lib/config.ts`: loads configuration and detects whether a package is configured for Changie.
-   `lib/validate.ts`: validates fragments for authoring, preview, and CI. Every fragment requires a positive integer `custom.PR`; `--require-pr` additionally requires a matching fragment for the target package.
-   `lib/exec-changie.ts`: runs the bundled Changie binary. `npm run lint:changelogs` combines Gutenberg policy checks with native batch dry-run compilation for each selected fragment-managed package, catching incompatible timestamps, custom values, and templates without consuming fragments or writing release files. Changie can create a missing project directory during a dry-run.
-   `lib/migrate.js`: bi-directional migration between traditional `CHANGELOG.md` files and Changie version/fragment files.
-   `lib/preview.js`: preview unreleased notes across packages.
-   `lib/release.js`: version bump calculation and batch/merge operations used during automated package publishing.

The private workspace exports its shared configuration and validator as TypeScript source. Consumers declare a workspace dependency and import `@wordpress/changelog-tools/config` or `@wordpress/changelog-tools/validate`, rather than using relative imports into another workspace. Node runs these modules with type stripping, so changelog commands need no build step. The workspace uses the repository's Node TypeScript preset for type checking.

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

1.  Consolidates all published historical versions into a single baseline file under `.changes/<package-name>/<latest-version>.md`, following [Changie's backup migration guide](https://changie.dev/guide/backup/). Future releases generate their own individual version files alongside this baseline.
2.  Converts any entries currently under `## Unreleased` into individual fragment files under `.changes/unreleased/<PR>__<package-name>__<kind>__<random>.yaml`. Both migration and `npm run changelog:add` use lowercase hyphenated kinds and a 12-character random hexadecimal suffix derived from a UUID. Updating a migration regenerates these suffixes.
3.  Replaces `packages/<package-name>/CHANGELOG.md` with the standard Changie header and unreleased stub comment.

### 3. Register the package in `.changie.yaml`

Add the package entry to the `projects` list in the root `.changie.yaml`:

```yaml
projects:
  - label: Components
    key: components
    changelog: packages/components/CHANGELOG.md
  - label: UI
    key: ui
    changelog: packages/ui/CHANGELOG.md
  - label: <Package Title>
    key: <package-name>
    changelog: packages/<package-name>/CHANGELOG.md
```

The `key` must match the package directory name under `packages/`. The `changelog` destination is required and must resolve to that package's existing `packages/<package-name>/CHANGELOG.md`. Changelog lint and release preparation check every project's destination before compilation or release-file changes; native `changie merge --dry-run` alone does not check whether the destination can be written.

### 4. Verify the migration

Confirm the package builds, passes changelog linting, and renders expected outputs:

```bash
# Preview the extracted unreleased notes
npm run changelog:preview -- <package-name>

# Test full changelog merge without modifying disk
npm exec --workspace @wordpress/changelog-tools --no -- changie merge --dry-run

# Run repository changelog linter
npm run lint:changelogs
```

## Promoting a pre-1.0 package to stable 1.0.0

For packages published as `0.x.y` pre-releases, promote the package to stable `1.0.0` using:

```bash
npm run changelog:add -- -j <package-name> -k "Stable Release" -m "PR=<PR#>" -b "Mark package as stable and production-ready."
```

This creates a `Stable Release` fragment under `.changes/unreleased/`. During the next automated package release, the presence of the `Stable Release` fragment directs the release bumper to issue a major bump to `1.0.0`.

`Stable Release` is the last kind in the regular `npm run changelog:add` prompt. Shared fragment validation rejects this kind unless the target package has a `0.x` version, covering the authoring command and CI. The authoring command validates after writing the fragment and leaves rejected content available to correct.

Promotion takes precedence over other change kinds, including breaking changes. The generated changelog includes a note below the version heading and retains the `Stable Release` section as the last kind. The note also appears in unreleased previews and prerelease notes containing the promotion fragment.

### Aborting a migration during development

If something went wrong during local testing or the migration PR is abandoned, discard your local working tree changes rather than using rollback:

```bash
git restore packages/<package-name>/CHANGELOG.md .changie.yaml
git clean -fd .changes/
```

## Updating a migration branch when falling behind trunk

If a PR branch migrating a package falls behind `trunk`, new changes may have been merged into `packages/<package-name>/CHANGELOG.md` using the old changelog method.

When rebasing on or merging `trunk`, Git will report a conflict on `packages/<package-name>/CHANGELOG.md`. To update:

1.  Keep trunk's version of the changelog:

    ```bash
    git checkout origin/trunk -- packages/<package-name>/CHANGELOG.md
    ```

2.  Run the update command to clean up previous fragments and re-migrate:

    ```bash
    npm run changelog:migrate -- <package-name> --update
    ```

3.  Stage the resolved changelog and newly updated fragments, then continue:

    ```bash
    git add packages/<package-name>/CHANGELOG.md .changes/
    git rebase --continue # or git commit if merging
    ```

## Reverting a migrated package (Post-merge rollback)

If a package has already been migrated, merged into `trunk`, and maintainers decide to reverse the migration back to traditional manual `CHANGELOG.md` maintenance, follow these steps:

### 1. Run migration rollback

Use the migration script's `--rollback` flag:

```bash
npm run changelog:migrate -- <package-name> --rollback
```

This reconstructs `packages/<package-name>/CHANGELOG.md` by combining the historical baseline version file, any subsequent version files, and pending unreleased fragments rendered through the same native compilation as `npm run changelog:preview`. Shared validation and compilation must succeed before the command writes the changelog and removes `.changes/<package-name>/` and the package's unreleased fragment files. Published history is preserved without re-rendering. The `Stable Release` subsection may appear last; ordinary subsections retain the configured order. Release version calculation recognizes either the promotion note or the `Stable Release` heading within `Unreleased`.

### 2. Remove package from `.changie.yaml`

Remove the package from the `projects` list in `.changie.yaml`.

### 3. Verify and commit

Verify the restored changelog formatting:

```bash
npm run lint:changelogs
```

Commit the restored `packages/<package-name>/CHANGELOG.md` and updated `.changie.yaml`.
