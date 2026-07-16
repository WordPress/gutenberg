# Actions

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A widget declares its data through `attributes`; it declares the verbs a user can trigger through `actions`. An action is something to _do_ — open a report, download a file — not something to configure. Like an attribute it is declarative and serializable, so it can ride in `widget.json`; unlike an attribute it names a verb, not a value.

The widget names the intent and a target; the host decides where the action appears and materializes it. The widget never knows its surface.

## Envelope and fulfillment

Every action carries an **envelope** — an `id` and a `label` — and one **fulfillment** that says what triggering it does. Today the only fulfillment is a `link`: a target the host renders as an anchor.

```ts
{
	id: 'view-report',
	label: __( 'View report' ),
	href: 'admin.php?page=reports',
}
```

`href` is a complete URL or path; external URLs and admin entry points load a full page. Two optional flags refine it:

-   `download`: turns the target into a file download; a string names the file.
-   `openInNewTab`: opens the target in a new browser tab.

```ts
{
	id: 'export',
	label: __( 'Export CSV' ),
	href: reportCsvUrl,
	download: 'report.csv',
}
```

## Placement is the host's

The widget lists its actions; it never says where they go. The host maps them to its own surfaces — a dashboard might gather them in a "More" menu, a footer, or a command palette. The same declaration surfaces differently in different hosts, and a host with no place for an action drops it. This is the contract attribute `relevance` already uses: the widget declares intent, the host owns the surface.

## Why a link

A link is data, so the action stays serializable and host-agnostic. Navigation and download are the browser's: the host renders the anchor and never interprets what the action means, and middle-click, copy-address, and the download attribute keep working. Building the URL — query strings, hashes — is the widget's job, with the standard `URL` / `URLSearchParams`.

## Today and later

The `link` fulfillment is the whole surface today. Two more are reserved, and both extend the same envelope, so an action's `id` and `label` do not change when its fulfillment does:

-   A `callback` fulfillment, for a verb that runs code the widget provides — a download whose bytes are generated in the browser, for instance.
-   A `steps` fulfillment, an ordered list of registered actions, backed by the connection language.
