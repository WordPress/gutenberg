# Step 24: site-health-counts

-   Branch: `wtc/24-site-health-counts`
-   Status: done
-   Depends on: 23

## Goal

Demonstrate the server lane for composition data: a dynamic block whose
`render_callback` reads backend state at `do_blocks()` time, inside the
widget-defs render endpoint, so a composed definition carries data no REST
endpoint exposes. The Site Health Overview swaps its static check list for
live counts.

## What changed

-   `COMP/site-health-counts-block.php`: registers
    `widget-def/site-health-counts` (no admin component on purpose: the SSR
    fallback is the lane under test). The render callback re-applies
    `view_site_health_checks` (the endpoint itself gates at `read`), reads
    the `health-check-site-status-result` transient, and renders the three
    counts as a core-block composition: a flex-vertical group wrapping a
    list, one status row per item, each count in a badge-recipe pill.
    Absent or malformed results render an empty-state paragraph naming the
    next step ("Visit Site Health to run the checks").
-   `gutenberg_get_site_health_counts()`: the boundary guard. One
    `json_decode`, shape-checked before any offset (`is_array`, then
    `is_numeric` per key, cast to `int`), `null` on anything else.
-   `COMP/core-widget-defs.php`: the overview composition drops the static
    list for `<!-- wp:widget-def/site-health-counts /-->`.
-   `COMP/load.php`: the block's `require`.
-   Tests: counts render from the transient; string counts cast (core stores
    them as posted); no transient and wrong-shape JSON render the empty
    state; below the capability the block renders nothing.

## Decisions and deviations from the oracle

-   No oracle counterpart. The block is registered from the vertical under
    the `widget-def/` namespace: it is not a `core/` block and not a
    `core-admin/` admin block (those carry client components; this one is
    server-rendered by design).
-   The render is itself a composition: the callback assembles core blocks
    and resolves them through a nested `do_blocks()`, the synced-pattern
    precedent, so the server lane stays blocks all the way down. Structural
    styles ride inline on the saved markup because the `layout` attribute's
    generated CSS travels through the page style engine, which a REST
    render never reaches; colors are the WPDS badge-recipe pairs
    (`background-surface-*` / `foreground-content-*`).
-   No heading inside the render: the chrome materializes the widget's
    identity, and the body never re-renders it.
-   The capability check inside the render callback is the pattern the
    endpoint's `read` gate forces: any dynamic block reachable through
    composed markup guards its own data. Recorded as a step 06 follow-up.
-   The client seam caches renders per markup + attributes for the session,
    so the counts are as fresh as the first mount. Acceptable for a weekly
    transient; a faster-moving source would need cache invalidation or the
    client lane (bindings, step 13).

## Verification

-   `php -l` clean on the touched files; `vendor/bin/phpcs` clean.
-   `vendor/bin/phpunit --filter Gutenberg_Widget_Type_Composer_` in the
    wp-env cli container: green, including the five new block tests.
-   Acceptance: asserted per the PLAN entry; the live render exercised in
    the browser on the integration branch, where `Details` also mounts the
    router link.

## Follow-ups

-   [x] Status colors landed as a hub follow-up: three stacked rows, each
    count in a badge-recipe pill (the `background-surface-*` /
    `foreground-content-*` WPDS pairs: success, caution, error), spacing
    from the `--wpds-dimension` scale. A fuller design pass (typography
    scale, iconography) still belongs with graduation.
-   [ ] Replace the hand-styled pill with the real `Badge` once steps 12
    and 13 land: `core-admin/badge` in the widget's own composition, fed
    the counts through a binding source. The pill is the server-lane
    stand-in; its tokens are the exact pairs `@wordpress/ui`'s Badge
    intents use, so the swap is visual identity, not redesign.
-   [ ] If the dashboard ever surfaces to roles below
    `view_site_health_checks`, the composition renders a paragraph and an
    empty gap; the definition would need a capability of its own.
