# ContentEditableControl

<!-- This file is generated automatically and cannot be edited directly. Make edits via TypeScript types and TSDocs. -->

🔒 This component is locked as a [private API](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-private-apis/). We do not yet recommend using this outside of the Gutenberg project.

<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-contenteditablecontrol--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>

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

### `disabled`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Whether the field is non-editable. A disabled field is not
`contentEditable` (so it is neither focusable nor editable), exposes
`aria-disabled` to assistive technology, and does not mount `children`.

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

### `help`

 - Type: `ReactNode`
 - Required: No

Additional description for the control.

Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an `aria-describedby` attribute.

### `isSelected`

 - Type: `boolean`
 - Required: No

The selection ("active") state of the field, for controlled usage.
When omitted, the control manages its own selection state directly from
the focus/blur transitions. Consumers whose format UI opens popovers
must control this prop and implement their own blur handling, since
only the consumer can tell whether the element receiving focus belongs
to one of its popovers.

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

### `required`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Whether the field is required. Exposed to assistive technology via
`aria-required`.
