# Step 05: controller-fields

- Branch: `wtc/05-controller-fields`
- Status: done
- Depends on: 02 (on the feature branch)

## Goal

Emit the server-defined fields over `/wp/v2/widget-modules` so the client can
tell each Widget Type's origin and, for server-defined ones, read the inline
composition and display metadata. Adds `origin`, `content`, `definition_id`,
`title`, `description`, `icon` to the response and schema.

## What changed

- `lib/experimental/dashboard-widgets/class-wp-rest-widget-modules-controller.php`:
  - `prepare_item_for_response`: derives the six fields per origin. `origin`
    defaults to `built-in`. `content` is the inline markup for code-registered
    and cpt, null for built-in. `definition_id` is the post ID for cpt, null
    otherwise. `title` is read from the registration (code-registered) or the
    post (`get_post()->post_title` for cpt), null for built-in. `description` and
    `icon` come from the registration (null for built-in and cpt).
  - `get_item_schema`: declares the six fields (origin as an enum, the rest
    `string|null` / `integer|null`, all readonly).
- `phpunit/experimental/widget-type-composer/widget-modules-fields-test.php`:
  new. Asserts the REST fields per origin and the schema.

## Decisions and deviations from the oracle

- Unconditional projection. The new fields are emitted without a composer
  experiment check in the controller, even though `CONVENTIONS` lists REST
  controllers among the trunk-shared files to gate behind the flag. The
  controller is a pure projection of `WP_Widget_Type_Registry`, and the feature
  gating already lives upstream: the code-registered and cpt resolver loops are
  guarded by `function_exists()` / `post_type_exists()`, so with the composer off
  no server-defined entries exist and every widget is built-in with null
  server-fields. Emitting unconditionally keeps the REST shape consistent across
  experiment states (a built-in widget always carries `content: null` rather than
  the field appearing and disappearing), which the client (step 07) reads more
  simply. `origin` is emitted unconditionally for the same reason step 02 tags it
  unconditionally in the registry. Matches the oracle.
- cpt title is read from `post_title`; cpt `description`/`icon` are null here. The
  step 04 resolver copies only `origin`/`definition_id`/`content` onto the cpt
  Widget Type, so the controller has no description/icon to surface; the composer
  reads those from `/wp/v2/widget-defs` directly. Faithful to the oracle.

## Verification

- php -l: clean on the controller and the test.
- phpcs: clean (2/2 files), run via the dev env.
- tests: `wordpress vendor/bin/phpunit -c phpunit.xml.dist --filter
  Gutenberg_Widget_Type_Composer_Widget_Modules_Fields_Test` -> OK (5 tests, 34
  assertions). Regression with the trunk `WP_REST_Widget_Modules_Controller_Test`
  and the composer definitions test -> OK (28 tests, 160 assertions): the added
  fields are additive and do not break the built-in response shape.
- acceptance (PLAN 05): the test asserts the REST response carries the fields per
  origin (built-in -> null content/title/definition_id; code-registered ->
  metadata + content; cpt -> title from the post, content inline, definition_id
  pointing at the post).

## Follow-ups

- [ ] cpt `description`/`icon` are null over `/wp/v2/widget-modules` today; surface
  them here too if a widget-modules consumer needs them (the editable values live
  on the `widget_def` meta read via `/wp/v2/widget-defs`).
