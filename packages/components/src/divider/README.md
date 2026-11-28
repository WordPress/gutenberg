# Divider

<p class="callout callout-alert">This component is deprecated. Prefer a <code>Separator</code> subcomponent such as <code>Menu.Separator</code> when the surrounding component provides one. Otherwise write your own CSS, preferably using the <a href="https://wordpress.github.io/gutenberg/?path=/docs/design-system-tokens-introduction--docs">design tokens</a> available in <code>@wordpress/theme</code>.</p>

`Divider` is a layout component that separates groups of related content.

## Usage

```jsx
import {
	__experimentalDivider as Divider,
} from `@wordpress/components`;
import { Stack } from '@wordpress/ui';

function Example() {
	return (
		<Stack direction="column" gap="lg">
			<span>Some text here</span>
			<Divider />
			<span>Some more text here</span>
		</Stack>
	);
}
```

## Props

### `margin`: `number`

Adjusts all margins on the inline dimension.

-   Required: No

### `marginEnd`: `number`

Adjusts the inline-end margin.

-   Required: No

### `marginStart`: `number`

Adjusts the inline-start margin.

-   Required: No

### `orientation`: `horizontal | vertical`

Divider's orientation. When using inside a flex container, you may need to make sure the divider is `stretch` aligned in order for it to be visible.

-   Required: No
-   Default: `horizontal`

### Inherited props

`Divider` also inherits all of the [`Separator` props](https://ariakit.org/reference/separator#optional-props).
