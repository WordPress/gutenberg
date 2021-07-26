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

[Description TBD].

- Required: No
- Default: `false`

### `isRounded`: `boolean`

[Description TBD].

- Required: No
- Default: `true`

### `isSeparated`: `boolean`

[Description TBD].

- Required: No
- Default: `false`

### `size`: `'small' | 'medium' | 'large'`

[Description TBD].

- Required: No
- Default: `medium`

## Context

[TBD]
