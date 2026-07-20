# Anatomy of the Widget Chrome

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The chrome is everything the dashboard wraps around a widget instance: the header, its controls, and the boundaries that catch errors and loading.

The widget declares its identity and how it wants to be framed; the chrome materializes both.
The widget never paints its own header or toolbar.

## The frame

The dashboard widget interprets `presentation` and determines how much chrome a widget gets.

* `framed` paints a header and pads the content. 
* `content-bleed` keeps the header but lets the content fill the available area.
* `full-bleed` hides the header and gives the widget the whole tile, while keeping the identity available to assistive technology.

Whatever the presentation, an error boundary and a loading fallback wrap the content, so a widget that throws or suspends never breaks the tile.

## The header

The header is a single row of three sections.

![The header row: an identity cluster on the leading edge, the attribute controls next, and the actions menu on the trailing edge.](./assets/header-anatomy.svg)

The sections are semantic. A control belongs to a section by its nature, not by how it renders.

-   **Identity.** The widget's icon, title, and help. It names the tile, and its title truncates rather than wrapping when the row runs short.
-   **Attributes.** The widget's high-relevance attributes: quick in-place editing or a dropdown button when there isn't enough space.
-   **More.** The widget's declared actions, gathered in a menu on the trailing edge.

### Fitting the row

Only the attributes change form. The identity truncates its title, and the actions menu is compact throughout.

Attributes are inline fields when they fit, or a form within a dropdown when they do not.

![Wide tiles keep the attributes inline; narrow tiles fold them into a dropdown, while the identity truncates its title and the actions menu stays.](./assets/header-fit.svg)

The header decides from what it measures: the row's own width, and the width each section reports.

It measures the identity as it stands, discounts the sections that keep their size, and gives the attributes what is left; when that is less than their inline width, they fold.

Because the decision measures the real row, every section counts on its own.

The widget declares its sections; the header measures the fit.
