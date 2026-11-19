# @wordpress/phpstan-tools

Tooling for the [PHPStan](https://phpstan.org/) static analysis of the PHP in the Gutenberg repository. This is a private workspace package and is not published to npm. See the [coding guidelines](/docs/contributors/code/coding-guidelines.md#php) for how to run the analysis, regenerate the baseline, and update the WordPress stubs.

## Contents

- `base.neon`: the shared configuration, which `phpstan.neon.dist` at the repository root includes along with the baseline.
- `baseline.neon`: the errors that predate the analysis, regenerated with `composer phpstan:baselines`. Entries whose errors were fixed are removed with `composer phpstan:fix`.
- `baseline-strict.neon`: the errors that predate the stricter analysis of the paths listed in `phpstan-strict.neon.dist` at the repository root, beyond those in `baseline.neon`. It is also regenerated with `composer phpstan:baselines`, and its entries whose errors were fixed are removed with `composer phpstan:fix:strict`.
- `bootstrap.php`, `polyfills.stub`, `wp-build-templates.php`, and `src/`: what PHPStan loads to analyze the code, including the parser for the `wp-build` PHP templates.
- `generate-wordpress-stubs.php` and `wordpress-stubs/`: the WordPress stubs generated from core trunk, and the script that generates them.
- `report.ts`: reports the errors in a PHPStan JSON report as annotations and in the job summary in CI.

## Reporting in CI

The `PHP static analysis` job in `.github/workflows/unit-test.yml` writes the report of each analysis as JSON and passes it to `report.ts` with the workspace's `report` script, adding `--strict` for the report of the strict paths:

```bash
npm run --workspace @wordpress/phpstan-tools report -- [--strict [--default-report <default-report.json>]] <report.json>
```

The analysis of the strict paths includes every rule of the other analysis, so an error at the lower rule level in a strict path is reported by both. The job passes the report of `phpstan.neon.dist` as `--default-report`, so that the report of the strict paths leaves out the errors that the other report already shows, and each error is annotated once.

The script imports nothing outside Node, which runs it by stripping the types, so it needs no build step and no installed dependencies. A relative path to the report is resolved from the directory that npm is run in. The script is type checked by `npm run typecheck` and linted by `npm run lint:js`.
