# ToolsPanelItem

<p class="callout callout-alert">This feature is still experimental. “Experimental” means this is an early
implementation subject to drastic and breaking changes.</p>
<br />

This component acts as a wrapper and controls the display of items to be contained
within a ToolsPanel. An item is displayed if it is flagged as a default control
or the corresponding panel menu item, provided via context, is toggled on for
this item.

## Usage

See [`tools-panel/README.md#usage`](/packages/components/src/tools-panel/tools-panel/)
for how to use `ToolsPanelItem`.

## Props

### `defaultShown`: `boolean`

For optional items only, this determines whether the item is shown on first
render even when `hasValue()` is `false`. An item is always shown while it has
a value, so this only controls the initial state of items without one.

-   Required: No
-   Default: `false`

### `hasValue`: `() => boolean`

This is called when building the `ToolsPanel` menu to determine the item's
initial checked state.

-   Required: Yes

### `isShownByDefault`: `boolean`

This prop identifies the current item as being displayed by default. This means
it will show regardless of whether it has a value set or is toggled on in the
panel's menu.

-   Required: No
-   Default: `false`

### `label`: `string`

The supplied label is dual purpose.
It is used as:

1. the human-readable label for the panel's dropdown menu
2. a key to locate the corresponding item in the panel's menu context to
   determine if the panel item should be displayed.

A panel item's `label` should be unique among all items within a single panel.

-   Required: Yes

### `onDeselect`: `() => void`

Called when this item is deselected in the `ToolsPanel` menu. This is normally
used to reset the panel item control's value.

-   Required: No

### `onSelect`: `() => void`

A callback to take action when this item is selected in the `ToolsPanel` menu.

-   Required: No

### `onShownChange`: `( isShown: boolean ) => void`

A callback executed when the user shows or hides the item via the panel's menu,
passed `true` when it was shown and `false` when it was hidden.

Unlike `onDeselect`, this fires whether or not the item has a value, and only in
response to an explicit menu action. Visibility changes with another cause do
not trigger it, such as an item becoming visible because it received a value or
because `defaultShown` was set, or hiding because `Reset all` ran.

Items flagged with `isShownByDefault` are always visible and stay so when
toggled off, so this is never called for them.

-   Required: No

#### Choosing between `onShownChange`, `onSelect` and `onDeselect`

`onSelect` and `onDeselect` are unchanged, so a single menu action may call one
of them alongside `onShownChange`:

| User action                              | Callbacks called                       |
| ---------------------------------------- | -------------------------------------- |
| Shows an optional item that has no value | `onShownChange( true )`, `onSelect`    |
| Hides an optional item that has no value | `onShownChange( false )`               |
| Hides an optional item that has a value  | `onShownChange( false )`, `onDeselect` |

Use `onShownChange` to track or persist whether the user wants an item visible,
and `onDeselect` to reset the control's value. They answer different questions,
so avoid wiring the same handler to both, which would handle one menu action
twice.

### `panelId`: `string | null`

Panel items will ensure they are only registering with their intended panel by
comparing the `panelId` props set on both the item and the panel itself, or if the `panelId` is explicitly `null`. This
allows items to be injected from a shared source.

-   Required: No

### `resetAllFilter`: `( attributes?: any ) => any`

A `ToolsPanel` will collect each item's `resetAllFilter` and pass an array of
these functions through to the panel's `resetAll` callback. They can then be
iterated over to perform additional tasks.

-   Required: No
-   Default: `() => {}`
