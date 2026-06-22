# Step 02: widget-type-origin

- Branch: `wtc/02-widget-type-origin`
- Status: done
- Depends on: 00

## Goal

Introduce the registry resolver's `origin` concept and the shared registration
helper, tagging built-in widget types with `origin = 'built-in'`. This is the
foundation the code-registered (03) and cpt (04) loops build on.

## What changed

- `lib/experimental/dashboard-widgets/widget-types.php`:
  - Added `GUTENBERG_WIDGET_TYPE_NAME_PATTERN` and
    `gutenberg_register_widget_type_if_new()` (validates the name shape, skips
    when already registered so earlier sources win, registers otherwise).
  - Rewrote `gutenberg_register_widget_types()` to register the built-in origin
    through the helper, tagging `origin => 'built-in'`.
  - Moved the `init` registration to priority 30, leaving room for later origin
    sources that populate at earlier priorities.
- `lib/experimental/dashboard-widgets/class-wp-widget-type.php`: declared the
  `$origin` property (set via `set_props`).

## Decisions and deviations from the oracle

- Only the built-in loop lands here. The code-registered and cpt loops are
  steps 03 and 04, added to the same function and helper. The oracle shipped all
  three at once; the rebuild keeps them atomic.
- Declared `$origin` explicitly on the class rather than relying solely on the
  oracle's dynamic-property behavior, to document the contract. Later steps add
  their own properties the same way.

## Verification

- `php -l`: clean on both files.
- phpcs / phpunit: not run locally (composer `vendor/` not installed).
- Acceptance: built-in widget types still register, now through the helper and
  carrying `origin = 'built-in'`; no code-registered or cpt loop present yet
  (grep-verified). The priority-30 hook leaves room for later origins.

## Follow-ups

- 03 adds the code-registered loop and the `$content`/`$title`/... class props.
- 04 adds the cpt loop and the `$definition_id` class prop.
