# ContentEditableControl

<!-- This file is generated automatically and cannot be edited directly. Make edits via TypeScript types and TSDocs. -->

🔒 This component is locked as a [private API](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-private-apis/). We do not yet recommend using this outside of the Gutenberg project.

<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-contenteditablecontrol--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>

A presentational `contentEditable` form control: a labeled editable element
rendered with the chrome (`BaseControl` + label) shared by the other form
controls in the package.

Unlike the in-canvas `RichText` from `@wordpress/block-editor`, this control
is intended for standalone form fields (DataForms, sidebar inputs, etc.).
It is deliberately **presentational only** and has no `@wordpress/rich-text`
dependency: the editable behavior (value, formatting, keyboard shortcuts)
and any focus/selection tracking are owned by the consumer, which wires them
through the forwarded ref and native event props (see the richtext DataForm
control in `@wordpress/dataviews` for the canonical assembly).

```jsx
// The rich-text "assembly" lives in the consumer.
<ContentEditableControl
    label="Caption"
    ref={ mergedRef }
    onFocus={ onEditableFocus }
    onBlur={ onEditableBlur }
/>
```

## Props

### `className`

 - Type: `string`
 - Required: No

### `disabled`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Whether the field is non-editable. A disabled field is not
`contentEditable` (so it is neither focusable nor editable) and exposes
`aria-disabled` to assistive technology.

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

### `label`

 - Type: `string`
 - Required: Yes

Label text for the control.

### `placeholder`

 - Type: `string`
 - Required: No

Placeholder text shown while the element has no content. Exposed to
assistive technology via `aria-placeholder` and drawn by the stylesheet
when the element is empty.

### `required`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Whether the field is required. Exposed to assistive technology via
`aria-required`.
