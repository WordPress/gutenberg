# Step 10: ssr-fallback

-   Branch: `wtc/10-ssr-fallback`
-   Status: done
-   Depends on: 09 (renderer core), 06 (render endpoint)

## Goal

Give the admin block renderer a per-block fallback so a composition can mix
blocks that have an admin (React) component with blocks that do not. A block
with no admin component is re-serialized to markup and resolved through the
step 06 endpoint, then injected as inert HTML inside the live React tree.

This is also the first step where the feature becomes visible: it carries the
first runtime caller of `gutenberg_register_widget_def()`.

## What changed

-   `ABR/serialize-node.ts` (+ test): rebuilds comment-delimited markup for one
    parsed node, splicing inner blocks back into their `innerContent`
    placeholders so nested blocks round-trip.
-   `ABR/ssr-fallback-block.tsx` (+ `.module.css`, + test): renders one
    unsupported block by resolving its markup through an injected `renderBlocks`
    seam, with an error state and a box-less wrapper.
-   `ABR/types.ts`: the `RenderBlocks` seam.
-   `ABR/admin-block-renderer.tsx`: a node with no registered admin component
    mounts the fallback instead of rendering nothing.
-   `WP-PRIM/components/widget-render`, `WP-DASH` (types, context, adapter,
    `widget-dashboard.tsx`): thread `renderBlocks` from the host to the renderer.
-   `routes/dashboard/wordpress-seams/`: the WordPress implementation, with the
    response cache.
-   `COMP/core-widget-defs.php`: `core/composition-demo`, a `core/cover` with a
    heading and a paragraph.

## Decisions and deviations from the oracle

-   **`renderBlocks` is injected, not imported.** The oracle's fallback imports
    `@wordpress/api-fetch` and hardcodes `/wp/v2/widget-defs/render`, which would
    put a network client and a route inside a package that depends only on
    `element`, `dataviews`, and the grammar parser. See _Who provides what_ in
    `ARCHITECTURE.md`.
-   **The response cache moved to the seam's implementation.** The oracle caches
    at module level inside the component; it belongs where the network call is.
-   **No `Spinner`.** Another `@wordpress/components` import the package does not
    carry. The fallback renders nothing while pending.
-   **`serialize-node.ts` duplicates core.** `serializeRawBlock()` in
    `@wordpress/blocks` is the canonical equivalent, unusable here because that
    package pulls 26 dependencies. Core published the grammar parser standalone
    but not the serializer. Noted in the file.
-   **One new dependency, `@wordpress/i18n`**, for the error copy. Pure, no store,
    no host coupling.

## What the work surfaced

Four things that were not visible from the plan.

-   **The demo cannot be called `core/hello-world`.** A built-in widget already
    owns that name, and built-in origins resolve first, so
    `gutenberg_register_widget_type_if_new()` skipped the definition silently.
    The collision rule working as designed, and a reminder that it is silent.
-   **The dashboard does not enqueue `wp-block-library`.** Block classes resolve
    to nothing, so a server-rendered composition has no styles. The demo carries
    its structural CSS inline. This affects every block that goes through the
    fallback, not just this one.
-   **`RawHTML` generates a `div` at runtime.** Its docblock notes the wrapper is
    stripped, but only by the server-side `renderElement` serializer. Two boxes
    sat between the host's content area and the composition, so percentage
    heights had nothing to resolve against. The class now lands on RawHTML's own
    div, with `display: contents`.
-   **Cover's layers need explicit stacking.** With no block CSS the image paints
    over the overlay, so the colour filter never showed.

## Verification

-   typecheck: `tsc --noEmit -p packages/widget-primitives` and
    `-p routes/dashboard`, clean.
-   lint: `lint-js` over `packages/widget-primitives`, `packages/widget-dashboard`,
    `routes/dashboard`, clean. `lint:css` on the module, clean. `php -l` on both
    PHP files, clean. `phpcs` not run: no `vendor/bin/phpcs` in this environment.
-   tests: `jest packages/widget-primitives/src/components/admin-block-renderer`,
    3 suites, 15 tests, green.
-   acceptance: _"a composition mixing a registered block and a `core/paragraph`
    renders the paragraph via the server, in order"_ is covered by
    `admin-block-renderer.tsx` → _"mixes admin blocks and server-rendered blocks,
    in order"_, which asserts the combined text content rather than only the
    presence of both. Verified in the browser through `core/composition-demo`.

## Follow-ups

-   [ ] Decide whether the dashboard should enqueue block styles, or whether every
        composition carries its own. Today only the second works.
-   [ ] `gutenberg_register_widget_type_if_new()` skips name collisions silently.
        A `_doing_it_wrong()` would have made the `core/hello-world` clash obvious
        instead of a missing widget.
-   [ ] The demo is a static composition. A dynamic core block (`core/calendar`,
        `core/latest-posts`) would exercise the architecture's claim that dynamic
        blocks work without a client reimplementation, which nothing verifies yet.
