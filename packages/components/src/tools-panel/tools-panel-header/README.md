# ToolsPanelHeader

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>
<br />

This component renders a tools panel's header including a menu.

## Usage

This component is generated automatically by its parent
`ToolsPanel`.

<div class="callout callout-alert">
<strong>In general, this should not be used directly.</strong>
</div>

## Props

### `header`: `string`

Text to be displayed within the panel header.

-   Required: Yes

### `menuLabel`: `string`

This is passed along as the `label` for the panel header's `DropdownMenu`.

-   Required: No

### `resetAll`: `function`

The `resetAll` prop provides the callback to execute when the "Reset all" menu
item is selected. It's purpose is to facilitate resetting any control values
for items contained within this header's panel.

-   Required: Yes

### `toggleItem`: `function`

This is executed when an individual control's menu item is toggled. It
will update the panel's menu item state and call the panel item's `onSelect` or
`onDeselect` callbacks as appropriate.

-   Required: Yes
