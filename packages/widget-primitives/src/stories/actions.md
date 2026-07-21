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

`href` is a complete URL, an admin PHP entry point, or a file shipped beside
the widget (resolved to a plugin URL on the server). External URLs and admin
entry points load a full page. Two optional flags refine it:

-   `download`: turns the target into a file download; a string names the file.
-   `openInNewTab`: opens the target in a new browser tab.

```ts
{
	id: 'export',
	label: __( 'Export CSV' ),
	href: 'report.csv', // file next to the widget under widgets/{name}/
	download: 'report.csv',
}
```

Do not embed file contents in a `data:` href. Ship a static file with the
widget, or have the host generate a download with `downloadBlob` for
client-built content.

## Placement is the host's

The widget lists its actions; it never specifies where they go. The host maps them to its surfaces: a dashboard might gather them in a "More" menu, a footer, or a command palette. 

This is the contract that the `relevance` attribute already uses: the widget declares intent, and the host owns the surface.