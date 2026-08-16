# Step 03: code-registered

- Branch: `wtc/03-code-registered`
- Status: done
- Depends on: 02 (on the feature branch)

## Goal

Add the code-registered origin: an in-memory registry of widget definitions
declared in PHP via `gutenberg_register_widget_def()`, plus the resolver loop
that registers each one as a Widget Type with `origin = 'code-registered'` and
inline composition `content`. No database row; the registration is the source
of truth for the request.

## What changed

- `lib/experimental/widget-type-composer/widget-definitions.php`: new file. The
  in-memory registry. `gutenberg_register_widget_def( $name, $args )` validates
  the name and the required `content`, merges metadata defaults, stores the
  entry, and warns via `_doing_it_wrong` on re-registration with differing args.
  `gutenberg_get_registered_widget_defs()` reads the registry.
  `gutenberg_get_widget_def_registry_ref()` is the private static-by-reference
  store, so state survives across calls without a top-level mutable global.
- `lib/experimental/widget-type-composer/load.php`: requires the new file (was
  an inert scaffold).
- `lib/experimental/dashboard-widgets/widget-types.php`: the resolver gains a
  second loop. For each registered definition it registers a Widget Type with
  `origin = 'code-registered'`, inline `content`, and display metadata, through
  the same `gutenberg_register_widget_type_if_new()` helper, so an earlier
  source (built-in) still wins on a name collision. Docblock and the priority-30
  comment updated to describe the code-registered origin.
- `phpunit/bootstrap.php`: seed `gutenberg-widget-type-composer => 1` in the test
  experiments option so the gated production file loads under test.
- `phpunit/experimental/widget-type-composer/trait-widget-type-composer-registry-reset.php`:
  new. Resets the in-memory def registry and the `WP_Widget_Type_Registry`
  singleton between tests.
- `phpunit/experimental/widget-type-composer/widget-definitions-test.php`: new.
  Covers the code-registered registry and its resolution.

## Decisions and deviations from the oracle

- Minimal arg shape. The oracle's `gutenberg_register_widget_def()` also merges
  `attributes_schema` and `sources` defaults, but nothing consumes them until the
  bindings/fields layers. Deferred to steps 13/18 where they are read, to keep
  this step to one concern. The resolver loop only reads what exists today
  (`title`/`description`/`icon`/`category`/`content`, plus `presentation` via a
  null-coalesce).
- `_doing_it_wrong` version string is `'Gutenberg 23.2'`, matching the step 02
  helper, so the feature is internally consistent. It is a single placeholder to
  reconcile to the real release version when the feature graduates (the deferred
  02-1 review nit).
- Reference-return assignment written as `$registry = &gutenberg_...()`. The
  oracle is inconsistent between its two files (`=&` vs `= &`); picked one form
  and used it in both the production file and the reset trait. phpcs clean.
- Test infra. Re-derived the reset trait with the `PHP_VERSION_ID < 80100` guard
  on `setAccessible` (trunk's `WP_Widget_Type_Registry_Test` pattern) rather than
  the oracle's unconditional call. The test covers only the code-registered slice
  of the oracle's `widget-definitions-test.php`; the CPT/REST/render cases belong
  to steps 04/06.

## Verification

- typecheck: n/a (PHP only).
- php -l: clean on all touched PHP files.
- phpcs: clean (6/6 files), run via the dev env:
  `wp-env run --env-cwd='wp-content/plugins/gutenberg' cli vendor/bin/phpcs <files>`.
- tests: `wp-env run --env-cwd='wp-content/plugins/gutenberg' wordpress
  vendor/bin/phpunit -c phpunit.xml.dist --filter
  Gutenberg_Widget_Type_Composer_Widget_Definitions_Test` -> OK (7 tests, 37
  assertions).
- acceptance (PLAN 03, "a test def registered on init appears in the registry
  with its content + metadata"): demonstrated by
  `test_code_registered_def_flows_through_resolver`: after
  `gutenberg_register_widget_def()` + `gutenberg_register_widget_types()`, the
  `WP_Widget_Type_Registry` entry carries `origin = 'code-registered'`, the inline
  `content`, the title/description/icon/category, and null `render_module` /
  `widget_module`. Registry defaults, input validation, silent-on-identical,
  warn-and-overwrite, and built-in precedence are covered by the sibling tests.

## Follow-ups

- [ ] `attributes_schema` / `sources` defaults land with their consumers in steps
  13 (binding-sources) and 18 (form-block).
- [ ] Reconcile the `_doing_it_wrong` version strings across the feature to the
  real release version at graduation.
