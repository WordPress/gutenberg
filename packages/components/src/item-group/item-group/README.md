# `ItemGroup`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ItemGroup` is [TBD]

## Usage

`ItemGroup` should be used in combination with the [`Item` component](/packages/components/src/item-group/item/README.md).

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

### `isBordered`: `boolean`

Renders borders around each items.

- Required: No
- Default: `false`

### `isRounded`: `boolean`

Renders with rounded corners.

- Required: No
- Default: `true`

### `isSeparated`: `boolean`

Renders items individually. Even if `isBordered` is `false`, a border in between each item will be still be displayed.

- Required: No
- Default: `false`

### `size`: `'small' | 'medium' | 'large'`

Determines the amount of padding within the component.
When not defined, it defaults to the value from the context (which is `medium` by default).

- Required: No
- Default: `medium`

## Context

[TBD]
