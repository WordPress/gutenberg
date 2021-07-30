# ProgressiveDisclosurePanelHeader

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>
<br />

This component renders a progressive disclosure panel's header including a menu.

## Usage

This component is generated automatically by its parent
`ProgressiveDisclosurePanel`.

<div class="callout callout-alert">
<strong>In general, this should not be used directly.</strong>
</div>

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
