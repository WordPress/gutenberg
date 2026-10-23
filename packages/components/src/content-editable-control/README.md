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
