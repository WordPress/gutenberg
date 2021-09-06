# ToolsPanelItem

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early
implementation subject to drastic and breaking changes.
</div>
<br />

This component acts a wrapper and controls the display of items to be contained
within a ToolsPanel. An item is displayed if it is flagged as a default control
or the corresponding panel menu item, provided via context, is toggled on for
this item.

## Usage

See [`tools-panel/README.md#usage`](/packages/components/src/tools-panel/tools-panel/)
for how to use `ToolsPanelItem`.

## Props

### `isShownByDefault`: `boolean`

This prop identifies the current item as being displayed by default. This means
it will show regardless of whether it has a value set or is toggled on in the
panel's menu.

-   Required: Yes

### `label`: `string`

The supplied label is dual purpose.
It is used as:
1. the human readable label for the panel's dropdown menu
2. a key to locate the corresponding item in the panel's menu context to
determine if the panel item should be displayed.

A panel item's `label` should be unique among all items within a single panel.

-   Required: Yes
