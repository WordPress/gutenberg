# Step 22: def-actions

-   Branch: `wtc/22-def-actions`
-   Status: done
-   Depends on: 03

## Goal

Let a code-registered widget definition declare `actions`, flowing through
the same pipeline as manifest actions: resolver, registry, REST, chrome.
The composition demo gains an external link action as the first case.

## What changed

-   `DASH/widget-types.php`: the code-registered loop passes
    `$definition['actions']` through `gutenberg_sanitize_widget_actions()`,
    the registration gate its docblock reserves for exactly this boundary.
-   `COMP/widget-definitions.php`: `actions` documented in the
    `gutenberg_register_widget_def()` args docblock. The registry stores args
    as declared; the gate lives at the resolver.
-   `COMP/core-widget-defs.php`: `core/composition-demo` declares
    `View the photo`, an external link to the demo's CC0 source photo, with
    `core/external` and `openInNewTab`.
-   Tests: the gate keeps a valid action and drops a `javascript:` href with
    the expected `_doing_it_wrong`; REST emits `actions` for a
    code-registered record.

## Decisions and deviations from the oracle

-   No oracle counterpart: the actions envelope postdates the recovered
    branch. The shape follows trunk's manifest-actions pipeline instead.
-   No relevance declared on the demo action: the widget is full-bleed, and
    the chrome routes every full-bleed action to the overlay menu regardless.
-   No JS changes: step 07's server-defined branch already resolves
    `record.actions` through `withRenderableIcons`.

## Verification

-   `php -l` and `phpcs` clean on the touched files.
-   `vendor/bin/phpunit --filter Gutenberg_Widget_Type_Composer_` in the
    wp-env cli container: 27 tests, 163 assertions, green.
-   Acceptance: the demo widget's overlay menu shows the action; the link
    opens the photo in a new tab.

## Follow-ups

-   CPT-origin definitions do not carry actions yet; when they do, the same
    resolver gate applies (`widget_def` post meta as the source).
