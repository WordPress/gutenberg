# AspectRatioIcon

<!-- This file is generated automatically and cannot be edited directly. Make edits via TypeScript types and TSDocs. -->

🔒 This component is locked as a [private API](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-private-apis/). We do not yet recommend using this outside of the Gutenberg project.

<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-aspectratioicon--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>

Renders a rounded rectangle with the shape of an aspect ratio, so that a
ratio can be recognized without reading its label.

## Props

### `ratio`

 - Type: `number | null`
 - Required: No

The aspect ratio to draw, as width divided by height, e.g. `16 / 9`.
Values that are not a positive number, like `0` for a free ratio, get
the generic aspect ratio icon.
