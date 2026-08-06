# PR Title

Dashboard: add a Site Health detail page as the dashboard's second route

---

## What

Adds `routes/site-health`, the dashboard app's second route, and links to it from the site-health widget through a new `Details` action.

Closes #81724. Part of #81723.

## Why

The dashboard app registered a single route, so every widget action pointed outside the app. This page is the first in-app destination and the testbed for in-app navigation: at this step the action link is a plain anchor, and the router-link upgrade is #81725.

## How

### The route

New `routes/site-health`, following the file-based route convention.

The `route` manifest in its `package.json` declares `{ "path": "/site-health", "page": [ "dashboard" ] }`. The build registry picks it up; there is no manual registration.

### The data

The page fetches the six async health tests core exposes over REST (`/wp-site-health/v1/tests/*`), the same source the site-health widget reads.

Direct (PHP-only) checks have no endpoint. They stay on the classic Site Health screen.

Responses are shape-checked at the REST boundary. A malformed result drops instead of rendering mislabeled. A failed fetch surfaces as an inline note, and when no check ran at all the page shows an error state with the cause.

### The table

DataViews with `titleField` and `descriptionField`. The description renders under the check title as plain text, one line per paragraph or result item.

Status and Category render as `Badge` chips from `@wordpress/ui`. Status maps severity to the badge intent: `critical → high`, `recommended → medium`, `good → stable`.

### The widget action

New `Details` action in `widgets/site-health/widget.json`, targeting `admin.php?page=dashboard-wp-admin&p=/site-health`.

`relevance: "high"` materializes it in the widget footer, with the `core/chart-bar` icon.

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
