# RichTextControl

<!-- This file is generated automatically and cannot be edited directly. Make edits via TypeScript types and TSDocs. -->

🔒 This component is locked as a [private API](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-private-apis/). We do not yet recommend using this outside of the Gutenberg project.

<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-richtextcontrol--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>

## Props

### `className`

 - Type: `string`
 - Required: No

### `children`

 - Type: `ReactNode`
 - Required: No

Placeholder slot for the rich-text assembly (e.g. `FormatEdit` and its
context providers), mounted only while the field has an active
selection.

### `defaultIsSelected`

 - Type: `boolean`
 - Required: No
 - Default: `false`

The initial selection state for uncontrolled usage.

### `disableLineBreaks`

 - Type: `boolean`
 - Required: No

Whether line breaks are disabled. Drives `aria-multiline`.

### `hideLabelFromVision`

 - Type: `boolean`
 - Required: No
 - Default: `false`

If true, the label will only be visible to screen readers.

### `isSelected`

 - Type: `boolean`
 - Required: No

The selection ("active") state of the field, for controlled usage.
When omitted, the control manages its own selection state from the
focus/blur transitions (deferring deselection so a format popover opened
from the field can claim focus without the field deselecting).

### `id`

 - Type: `string`
 - Required: No

Unique identifier for the control.

### `label`

 - Type: `string`
 - Required: Yes

Label text for the control.

### `onSelectedChange`

 - Type: `((isSelected: boolean) => void)`
 - Required: No

Called when the field gains or loses an "active" selection, in both
controlled and uncontrolled usage.
