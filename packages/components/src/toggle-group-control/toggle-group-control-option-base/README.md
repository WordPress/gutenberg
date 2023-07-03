# `ToggleGroupControlOptionBase`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ToggleGroupControlOptionBase` is a form component and is meant to be used as an internal, generic component for any children of [`ToggleGroupControl`](<(/packages/components/src/toggle-group-control/toggle-group-control/README.md)>).

## Props

### `children`: `ReactNode`

The children elements.

-   Required: Yes

### `value`: `string | number`

The value of the `ToggleGroupControlOptionBase`.

-   Required: Yes

### `showTooltip`: `boolean`

Whether to show a tooltip when hovering over the option. The tooltip will only show if a label for it is provided using the `aria-label` prop.

-   Required: No
