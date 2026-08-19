# Step 23: site-health-def

-   Branch: `wtc/23-site-health-def`
-   Status: done
-   Depends on: 22

## Goal

A second shipped definition that composes a real dashboard case:
`core/site-health-overview`, a framed overview of the site health checks
whose `Details` action targets the dashboard's own Site Health route
(`admin.php?page=dashboard-wp-admin&p=/site-health`) and whose `Status`
action targets the classic screen. Mirrors the shape of the built-in
`core/site-health` widget, so the same declaration exercises def actions in
the footer, and, once the widget host links seam
(WordPress/gutenberg#81740) lands, the in-app target upgrades to the host
router's link with no definition change.

## What changed

-   `COMP/core-widget-defs.php`: `gutenberg_get_site_health_overview_content()`,
    a framed composition of static core blocks (paragraph plus the three
    async check areas as a list), every one resolved through the SSR
    fallback; the `core/site-health-overview` registration with the two
    actions (`Details` high, in-app; `Status` medium, classic screen).
-   Tests: the shipped def resolves into `WP_Widget_Type_Registry` with
    origin, presentation, icon, and both actions surviving the gate, the
    in-app href intact.

## Decisions and deviations from the oracle

-   No oracle counterpart: the definition is new, built for the router-link
    seam demo. Content mirrors the composition-demo conventions (inline
    spacing, core blocks only, SSR fallback path).
-   `framed`, unlike the full-bleed composition demo, so the footer
    materializes the actions: `Details` as the leading text link and
    `Status` as the compact icon affordance beside it. On the chain both
    mount plain anchors; with the seam, `Details` upgrades and `Status`
    stays plain, the contrast in one strip.
-   The body lists check areas, not results: a static composition cannot
    carry live data (bindings and connections are later steps), so the
    overview names the three async checks the Details page reports and
    claims nothing more.

## Verification

-   `php -l` clean on the touched files; `vendor/bin/phpcs` clean.
-   `vendor/bin/phpunit --filter Gutenberg_Widget_Type_Composer_` in the
    wp-env cli container: green, including the new shipped-def resolution
    test.
-   Acceptance: the def resolves with both actions and the in-app href
    intact (asserted); the widget renders framed through the SSR fallback
    with `Details` in the footer (renderer path shipped in 08-10, exercised
    in the browser on the integration branch).

## Follow-ups

-   [ ] When WordPress/gutenberg#81740 lands and step 17 provides the seam
    on the chain, confirm `Details` mounts the router link on the dashboard
    with no change to this definition.
-   [x] Step 24 replaced the static list with the server-rendered
    `widget-def/site-health-counts` block. A binding source (step 13) stays
    the client-side alternative if the counts ever need to be reactive.
