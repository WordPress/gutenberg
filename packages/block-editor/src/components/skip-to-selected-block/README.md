# SkipToSelectedBlock

`SkipToSelectedBlock` provides a way for keyboard and assistive technologies users to jump back to the currently selected block.

The component renders as a visually hidden, secondary button with the text, 'Skip to the selected block'. When clicked it will set [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLOrForeignElement/focus) on the currently selected block. This means that the currently selected block will now receive all keyboard and similar events by default until focus is moved elsewhere.

If there are multiple blocks selected, the focus will be set on the block that was selected first.

## Usage

Render a `<SkipToSelectedBlock />` component passing in the currently selected block's `clientId`.

```jsx
function render( { clientId } ) {
	return (
		<div>
			<SkipToSelectedBlock selectedBlockClientId={ clientId } />
		</div>
	);
}
```

_Note:_

## Props

### `selectedBlockClientId`

-   **Type:** `String`
-   **Required** `true`
-   **Default:** `undefined`

The `selectedBlockClientId` is passed to `useBlockRef` inside the component to correctly reference the currently selected block.

If a `clientId` is not provided, the component will return `null`.

## Examples

This component is currently used in the [block inspector](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-editor/src/components/block-inspector) in the sidebar, at the bottom right corner of the screen.
