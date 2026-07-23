# Actions

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A widget declares its data through `attributes`; it declares the verbs a user can trigger through `actions`.

An action is something to _do_: open a report, download a file, etc. Like other widgets' props, it's declarative and serializable, so it can ride in `widget.json`.

The widget names the intent and a target; the host decides where the action appears and how it materializes.

## Envelope and fulfillment

Every action carries an **envelope**: an `id` and a `label`, and one **fulfillment** that says what it triggers.
Today, the only fulfillment is a `link`: a target the host renders as an anchor.

```ts
{
	id: 'view-report',
	label: __( 'View report' ),
	href: 'admin.php?page=reports',
}
```

`href`: absolute URL, admin `.php` entry point, root-relative path, or a file
next to the widget (resolved to a plugin URL on the server). `data:` and
`javascript:` hrefs are rejected at registration. Use `downloadBlob` for client-generated
files. Query strings on local filenames (e.g. `report.csv?v=2`) are not
resolved as widget files.

-   `download`: download instead of navigate; a string sets the filename.
-   `openInNewTab`: open in a new tab.

```ts
{
	id: 'export',
	label: __( 'Export CSV' ),
	href: 'report.csv', // widgets/{name}/report.csv
	download: 'report.csv',
}
```

## Placement is the host's

The widget lists its actions; it never specifies where they go. The host maps them to its surfaces: a dashboard might gather them in a "More" menu, a footer, or a command palette. 

This is the contract that the `relevance` attribute already uses: the widget declares intent, and the host owns the surface.