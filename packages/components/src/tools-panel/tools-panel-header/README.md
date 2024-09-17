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

### `dropdownMenuProps`: `{}`

The dropdown menu props to configure the panel's `DropdownMenu`.

-   Type: `DropdownMenuProps`
-   Required: No

### `headingLevel`: `1 | 2 | 3 | 4 | 5 | 6 | '1' | '2' | '3' | '4' | '5' | '6'`

The heading level of the panel's header.

-   Required: No
-   Default: `2`

### `label`: `string`

Text to be displayed within the panel header. It is also passed along as the
`label` for the panel header's `DropdownMenu`.

-   Required: Yes

### `resetAll`: `() => void`

The `resetAll` prop provides the callback to execute when the "Reset all" menu
item is selected. Its purpose is to facilitate resetting any control values
for items contained within this header's panel.

-   Required: Yes

### `toggleItem`: `( label: string ) => void`

This is executed when an individual control's menu item is toggled. It
will update the panel's menu item state and call the panel item's `onSelect` or
`onDeselect` callbacks as appropriate.

-   Required: Yes
