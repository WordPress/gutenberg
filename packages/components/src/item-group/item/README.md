# `Item`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Item` is [TBD]

## Usage

`Item` should be used in combination with the [`ItemGroup` component](/packages/components/src/item-group/item-group/README.md).

```jsx
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';

function Example() {
	return (
		<ItemGroup>
			<Item>Code</Item>
			<Item>is</Item>
			<Item>Poetry</Item>
		</ItemGroup>
	);
}
```

## Props

### `isAction`: `boolean`

Renders the item as an interactive `button` element.

- Required: No
- Default: `false`

### `size`: `'small' | 'medium' | 'large'`

Determines the amount of padding within the component.

- Required: No
- Default: `medium`

## Context

[TBD]
