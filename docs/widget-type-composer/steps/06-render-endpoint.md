# Step 06: render-endpoint

- Branch: `wtc/06-render-endpoint`
- Status: done
- Depends on: 03, 04 (on the feature branch)

## Goal

Server render of a composition. A `POST /wp/v2/widget-defs/render` route runs
`do_blocks()` over raw block markup with the posted per-instance `attributes`
seeded into block context, and a `core/instance-attribute` binding source pulls
those values into bound blocks. This is the host-agnostic render path that both
server-defined origins (code-registered and cpt) share.

## What changed

- `lib/experimental/widget-type-composer/widget-definitions.php`:
  - `gutenberg_render_widget_def_markup()`: seeds `widget/instanceAttributes`
    onto the block context with a `render_block_context` filter (removed right
    after `do_blocks()` so it never leaks into other renders in the request),
    runs `do_blocks()` + `wp_filter_content_tags()`, returns `{ rendered }`.
    Empty content short-circuits to an empty render.
  - `gutenberg_register_widget_def_render_route()` (on `rest_api_init`):
    registers the POST route with a required `content` string and an optional
    `attributes` object (default `[]`); permission is `current_user_can('read')`.
- `lib/experimental/widget-type-composer/instance-attribute-source.php`: new. The
  `core/instance-attribute` block bindings source.
  `gutenberg_instance_attribute_binding_get_value()` reads the binding's `field`
  arg from the `widget/instanceAttributes` context (null when absent, which
  leaves the block's default content in place); registered with
  `uses_context => ['widget/instanceAttributes']` on `init`.
- `lib/experimental/widget-type-composer/load.php`: requires the new source file
  (and the stale "CPT added later" comment on the widget-definitions require is
  corrected, cpt landed in step 04).
- `phpunit/experimental/widget-type-composer/instance-attribute-test.php`: new.

## Decisions and deviations from the oracle

- Faithful re-derivation of the oracle's render route, callback, and binding
  source. The composition is shared across instances, so the markup cannot carry
  an instance's own text; the binding is the declarative equivalent of reading
  `$attributes['field']` in a built-in widget's render code.
- The render closure is scoped to one `do_blocks()` call and removed immediately,
  so concurrent renders in the same request never see each other's attributes.
- The test re-derives only the step 06 slice of the oracle's
  `instance-attribute-test.php`: the source registration, the render endpoint
  (seeding, default-when-missing, empty content, permission), and the cpt
  composition resolving through the endpoint. The oracle's `core/ssr-hello-world`
  smoke definition belongs to step 21 and is excluded here.

## Verification

- php -l: clean on all touched PHP files.
- phpcs: clean (4/4 files), run via the dev env.
- tests: `wordpress vendor/bin/phpunit -c phpunit.xml.dist --filter
  Gutenberg_Widget_Type_Composer_Instance_Attribute_Test` -> OK (6 tests, 20
  assertions). Full `--group widget-type-composer` -> OK (26 tests, 155
  assertions); trunk controller + registry tests -> OK.
- acceptance (PLAN 06): `test_render_endpoint_seeds_instance_attributes` posts the
  bound composition with `{ name: 'Marketing' }` and again with `{ name: 'Sales' }`
  and asserts each rendered HTML carries its own instance value (and not the
  default), demonstrating "POST content + attributes returns resolved HTML with
  the attributes applied". `test_cpt_composition_resolves_through_render_endpoint`
  proves a cpt composition resolves through the same endpoint.

## Follow-ups

- [ ] The client-side SSR fallback (step 10) consumes this endpoint for blocks
  with no admin component; the binding source is consumed by the bindings layer
  (step 13).
