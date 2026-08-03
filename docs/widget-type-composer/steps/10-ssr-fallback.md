# Step 10: ssr-fallback

-   Branch: `wtc/10-ssr-fallback`
-   Status: in-progress
-   Depends on: 09 (renderer core), 06 (render endpoint)

## Goal

Give the admin block renderer a per-block fallback so a composition can mix
blocks that have an admin (React) component with blocks that do not. A block
with no admin component is re-serialized to markup and resolved through the
step 06 endpoint, then injected as inert HTML inside the live React tree.

This is also the first step where the feature becomes **visible**: it carries
the first runtime caller of `gutenberg_register_widget_def()`, a Hello World
built from core blocks.

## What changed

-   `ABR/serialize-node.ts`: rebuilds comment-delimited markup for one parsed
    node, splicing inner blocks back into their `innerContent` placeholders so
    nested blocks round-trip.
-   `ABR/ssr-fallback-block.tsx` (+ `.module.css`): renders one unsupported block
    by resolving its markup through an injected `renderBlocks` seam, with loading
    and error states and a scoped wrapper.
-   `ABR/admin-block-renderer.tsx`: a node with no registered admin component now
    mounts the fallback instead of rendering nothing.
-   `COMP/core-widget-defs.php`: the first runtime definition, `core/hello-world`,
    a heading plus a paragraph plus an image.
-   Dashboard: the WordPress implementation of `renderBlocks`, grouped with the
    other seam implementations.

## Decisions and deviations from the oracle

-   **`renderBlocks` is injected, not imported.** The oracle's fallback imports
    `@wordpress/api-fetch` and hardcodes `/wp/v2/widget-defs/render`, which would
    put a network client and a route inside a package that depends only on
    `element`, `dataviews`, and the grammar parser. The seam keeps
    `widget-primitives` host-agnostic and follows the shape `ResolveWidgetModule`
    already set. See _Who provides what_ in `ARCHITECTURE.md`.
-   **No `Spinner`.** The oracle renders `@wordpress/components`' `Spinner` while
    loading, another dependency the package does not carry. The fallback renders
    nothing while pending; a host that wants a placeholder wraps it.
-   **The demo uses core blocks only.** No admin block exists yet (step 12), and
    none is needed: core blocks are exactly the case the fallback covers, so the
    demo exercises the real path rather than a synthetic one.

## Verification

-   typecheck: pending
-   lint / phpcs: pending
-   tests: pending
-   acceptance: pending

## Follow-ups

-   [ ] The response caching that the oracle keeps at module level was left out
        for now; decide whether it belongs in the seam's implementation (where the
        network call is) rather than in the component.
