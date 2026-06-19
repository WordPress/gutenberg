# Step 00 — gate-scaffold

- Branch: `wtc/00-gate-scaffold`
- Status: done
- Depends on: none

## Goal

Register the `gutenberg-widget-type-composer` experiment and gate an inert entry
point for the feature's PHP. No behavior yet: with the flag off nothing loads;
with it on, an empty entry point loads.

## What changed

- `lib/experimental/experiments/load.php`: added the experiment definition (id,
  label, description) after the New Dashboard experience entry.
- `lib/load.php`: added a gate that requires the feature entry point when the
  experiment is enabled.
- `lib/experimental/widget-type-composer/load.php`: new inert entry point;
  later steps add their `require` here.

## Decisions and deviations from the oracle

- The gate requires a single `widget-type-composer/load.php` entry point,
  mirroring the `dashboard-widgets` layout, instead of requiring each PHP file
  directly from `lib/load.php` (what the oracle did). This keeps `lib/load.php`
  minimal and lets every later step register its file in one place.

## Verification

- `php -l`: clean on the three touched files.
- phpcs: not run locally (composer `vendor/` is not installed in this checkout);
  to confirm in an environment with dev dependencies.
- Acceptance: the experiment definition is present and well-formed; the gate is
  wired to the experiment; the entry point is inert (zero `require`s), so the
  feature is off by default and adds nothing observable when enabled.

## Follow-ups

- Steps 03 / 04 / 06 register their PHP by adding `require_once` to
  `widget-type-composer/load.php`.
