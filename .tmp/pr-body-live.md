## What

Adds `routes/site-health`, the dashboard app's second route, and links to it from the site-health widget through a new `Details` action.

Closes #81724. Part of #81723.

## Why

The dashboard app registered a single route, so every widget action pointed outside the app. This page is the first in-app destination and the testbed for in-app navigation: at this step the action link is a plain anchor, and the router-link upgrade is #81725.

## How

- New `routes/site-health` following the file-based route convention: the `route` manifest in `package.json` declares `{ "path": "/site-health", "page": [ "dashboard" ] }`, and the build registry picks it up. No manual registration.
- The page fetches the six async health tests core exposes over REST (`/wp-site-health/v1/tests/*`), the same source the site-health widget reads. Direct (PHP-only) checks have no endpoint and stay on the classic screen.
- Responses are shape-checked at the REST boundary: malformed results drop instead of rendering mislabeled, failed fetches surface as an inline note, and an error state with the cause covers the case where no check ran.
- DataViews table with `titleField` + `descriptionField`: the description renders under the check title as plain text with one line per paragraph or result item. Status and Category render as `Badge` chips from `@wordpress/ui`; status maps severity to the badge intent (`critical → high`, `recommended → medium`, `good → stable`).
- New `Details` action in `widgets/site-health/widget.json` with `relevance: "high"` (materializes in the widget footer) and the `core/chart-bar` icon, targeting `admin.php?page=dashboard-wp-admin&p=/site-health`.

## Testing

1. Enable the New Dashboard experience experiment on Gutenberg → Experiments.
2. Rebuild so the routes registry and the widget manifest regenerate:

```bash
npm run build
```

3. Open Dashboard (Beta) and add the Site Health widget if it is not on the grid.
4. The widget footer shows the `Details` action; following it lands on the Site Health page (full page load for now).
5. The page lists the six async checks. Sorting by status ranks critical first; the Status and Category filters work; the description shows one line per paragraph or result item.
6. Optional: log out of the REST session or block the `wp-site-health` namespace to see the error state and the partial-failure note.

## Follow-ups

- [ ] #81725: render in-app action links through the host router, upgrading `Details` to client-side navigation.

