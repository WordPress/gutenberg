# Step 04: cpt-defs

- Branch: `wtc/04-cpt-defs`
- Status: done
- Depends on: 02 (on the feature branch)

## Goal

Add the CPT origin: the `widget_def` post type (capabilities, meta, REST at
`/wp/v2/widget-defs`) and the resolver loop that registers each published post as
a Widget Type named `widget-def/{slug}` with `origin = 'cpt'`, `definition_id`,
and the post content inline. This is the persistent, user-editable origin the
visual composer will write to.

## What changed

- `lib/experimental/widget-type-composer/widget-definitions.php`: the CPT layer,
  ahead of the code-registered registry from step 03. Header updated to describe
  both storage layers.
  - `gutenberg_register_widget_def_post_type()` (on `init`): a private CPT,
    `show_in_rest` at `/wp/v2/widget-defs` via `WP_REST_Posts_Controller`,
    supporting editor/revisions/author/custom-fields.
  - `gutenberg_register_widget_def_post_meta()`: four meta fields,
    `attributes_schema`, `sources`, `category`, `icon`, with custom REST schemas
    for the first two.
  - `gutenberg_widget_def_attributes_schema_rest_schema()` /
    `gutenberg_widget_def_sources_rest_schema()`: the JSON Schemas.
  - `gutenberg_widget_def_synthesize_cap()` (on `user_has_cap`): grants the
    `manage_widget_definitions` primitive to users that hold `manage_options`.
- `lib/experimental/dashboard-widgets/widget-types.php`: the resolver gains the
  cpt loop (built-in -> code-registered -> cpt). Docblock and priority comment
  updated for three origins.
- `phpunit/experimental/widget-type-composer/widget-definitions-test.php`:
  extended with the CPT cases (post type, meta, caps, REST round-trip, schema
  validation, resolver).

## Decisions and deviations from the oracle

- Meta scope. Followed PLAN 04 ("CPT + meta"): all four meta fields land here with
  the CPT, exposing the complete editable entity over `/wp/v2/widget-defs`. This
  is asymmetric with step 03, where `attributes_schema`/`sources` were deferred
  from the code-registered defaults; the reason is that the CPT defines its
  persistent, REST-exposed schema once with the post type, whereas the
  code-registered function defaults are extended at point-of-use. The runtime
  consumers of `attributes_schema`/`sources` still arrive in steps 13/18; only the
  storage shape is defined now.
- Capability model. A single `manage_widget_definitions` primitive gates the CPT.
  Only primitive caps are aliased to it; meta caps (`edit_post`, `read_post`,
  `delete_post`) are deliberately left unaliased, otherwise the
  `$post_type_meta_caps` reverse lookup makes
  `map_meta_cap('manage_widget_definitions')` loop back to `edit_post` and resolve
  to `do_not_allow` with no post ID in scope. With `map_meta_cap = true`, WP maps
  the meta caps via ownership and the primitives collapse to the one cap,
  synthesized from `manage_options` (the effective gate the PLAN asks for) and
  unhookable for a different role mapping.
- The cpt loop hardcodes the `'widget_def'` slug rather than the
  `GUTENBERG_WIDGET_DEF_POST_TYPE` constant: the constant lives in the COMP file
  (gated by the composer experiment) while the loop lives in DASH (a different
  gate). `post_type_exists()` keeps the loop inert when the composer is off.

## Verification

- php -l: clean on all touched PHP files.
- phpcs: clean (3/3 files), run via the dev env (`cli vendor/bin/phpcs <files>`).
- tests: `wordpress vendor/bin/phpunit -c phpunit.xml.dist --filter
  Gutenberg_Widget_Type_Composer_Widget_Definitions_Test` -> OK (15 tests, 101
  assertions). Regression on `WP_Widget_Type_Registry_Test` +
  `WP_REST_Widget_Modules_Controller_Test` -> OK (28 tests, 73 assertions).
- acceptance (PLAN 04): `test_cpt_def_flows_through_resolver` publishes a
  `widget_def` post and asserts it resolves to `widget-def/{slug}` with
  `origin = 'cpt'`, `definition_id`, and inline `content`;
  `test_widget_def_cap_synthesized_for_admin` and
  `test_admin_passes_create_posts_cap_check` assert CRUD is gated to
  `manage_options` (admin yes, subscriber no, gone when the synthesizer is
  unhooked).

## Follow-ups

- [ ] `attributes_schema` / `sources` meta are stored now but consumed in steps 13
  (binding-sources) and 18 (form-block).
- [ ] Update `assets/origin-resolution.svg`: flip the `cpt` box from planned
  (dashed) to shipped (solid) now that the origin resolves.
