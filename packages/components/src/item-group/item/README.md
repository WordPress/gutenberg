# `Item`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Item` is used in combination with `ItemGroup` to display a list of items grouped and styled together.

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

### `onClick`: `React.MouseEventHandler<HTMLDivElement>`

Even handler for processing `click` events. When defined, the `Item` component will render as a `button` (unless differently specified via the `as` prop).

- Required: No

### `size`: `'small' | 'medium' | 'large'`

Determines the amount of padding within the component.

- Required: No
- Default: `medium`

### Context

`Item` is connected to [the `<ItemGroup />` parent component](/packages/components/src/item-group/item-group/README.md) using [Context](https://reactjs.org/docs/context.html). Therefore, `Item` receives the `size` prop from the `ItemGroup` parent component.

In the following example, the `<Item />` will render with a size of `small`:

```jsx
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';

const Example = () => (
	<ItemGroup size="small">
		<Item>...</Item>
	</ItemGroup>
);
```
