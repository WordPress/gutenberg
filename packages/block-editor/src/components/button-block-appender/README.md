ButtonBlockAppender
=============================

`ButtonBlockAppender` provides button with a `+` (plus) icon which when clicked will trigger the default Block `Inserter` UI to allow a Block to be inserted. 

This is typically used as an alternative to the `<DefaultBlockAppender />` component to determine the initial placeholder behaviour for a Block when displayed in the editor UI.

## Usage

In a block's `edit` implementation, render a `<ButtonBlockAppender />` component passing in the `rootClientId`.


```jsx
function render( { clientId }) {
	return (
		<div>
			<p>Some rendered content here</p>
			<ButtonBlockAppender rootClientId={ clientId } />
		</div>
	);
}
```

_Note:_ 

## Props

### `rootClientId`
* **Type:** `String`
* **Required** `true`
* **Default:** `undefined`

The `clientId` of the Block from who's root new Blocks should be inserted. This prop is required by the block `Inserter` component. Typically this is the `clientID` of the Block where the prop is being rendered.

### `className`
* **Type:** `String`
* **Default:** `""`

A CSS `class` to be _prepended_ to the default class of `"button-block-appender"`.

## Examples

The [`<InnerBlocks>` component](../inner-blocks/) exposes an enhanced version of `ButtonBlockAppender` to allow consumers to choose it as an alternative to the standard behaviour of auto-inserting the default Block (typically `core/paragraph`).
