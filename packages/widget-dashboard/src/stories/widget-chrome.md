# Anatomy of the Widget Chrome

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The chrome is everything the dashboard wraps around a widget instance: the header, its controls, and the boundaries that catch errors and loading.

The widget declares its identity and how it wants to be framed; the chrome materializes both.
The widget never paints its own header or toolbar.

## The frame

The widget declares its identity and how it wants to be framed; the chrome materializes both. The widget never paints its own header or toolbar.

The dashboard widget interprets `presentation` and determines how much chrome a widget gets.

* `framed` paints a header and pads the content. 
* `content-bleed` keeps the header but lets the content fill the available area.
* `full-bleed` hides the header and gives the widget the whole tile, while keeping the identity available to assistive technology.

Whatever the presentation, an error boundary and a loading fallback wrap the content, so a widget that throws or suspends never breaks the tile.

## The header

The header is a single row of three sections.

![The header row: an identity cluster on the leading edge, the attribute controls next, and the actions menu on the trailing edge.](./assets/header-anatomy.svg)

The sections are semantic. A control belongs to a section by its nature, not by how it renders.

-   **Identity.** The widget's icon, title, and help.  It names the tile and shrinks to a readable floor before anything else gives way.
-   **Attributes.** The widget's high-relevance attributes: quick in-place editing or a dropdown button when there isn't enough space.
-   **More.** The widget's declared actions, gathered in a menu on the trailing edge.

### Fitting the row

Each section renders inline when the row has room, and folds into a compact form when it does not.

Attributes are inline fields when they fit, or a form within a dropdown when they do not.

![Wide tiles keep the attributes inline; narrow tiles fold them into a dropdown, while the identity holds its floor and the actions menu stays.](./assets/header-fit.svg)

The header is determined by the actual number of rows.

It reserves the identity its floor, then gives the attributes their inline form while the row still has room; when the room runs out, they fold.
The actions menu stays compact throughout.

Because the decision measures the real row, every section counts on its own.

The widget declares its sections; the header measures the fit.
