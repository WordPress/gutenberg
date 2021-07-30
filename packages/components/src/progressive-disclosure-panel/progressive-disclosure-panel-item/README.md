# ProgressiveDisclosurePanelItem

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>
<br />

This component acts a wrapper and controls the display of items to be contained
within a ProgressiveDisclosurePanel. An item is displayed if it is
flagged as a default control or the corresponding panel menu item, provided via
context, is toggled on for this item.

## Usage

See [`progressive-disclosure-panel/README.md#usage`](/packages/components/src/progressive-disclosure-panel/progressive-disclosure-panel/) for how to use
`ProgressiveDisclosurePanelItem`.

## Props

### `isShownByDefault`: `boolean`

This prop identifies the current item as being displayed by default. This means
it will show regardless of whether it has a value set or is toggled on in the
panel's menu.

-   Required: Yes

### `label`: `string`

The label acts as a key to locate the corresponding item in the panel's menu
context. This is used when checking if the panel item should be displayed.

-   Required: Yes
