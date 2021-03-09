# TooltipButton

`TooltipButton` is a simple component that composes `Button` with a `Tooltip`. It mostly exists as an adaptive layer between the `Button` it uses and the original `Button`.

## Usage

```jsx
import { TooltipButton } from '@wordpress/components/ui';

function Example() {
	return (
		<TooltipButton
			variant="secondary"
			tooltip={ { content: 'WordPress.org' } }
		>
			Code is Poetry
		</TooltipButton>
	);
}
```

## Props

`TooltipButton` accepts all the regular `Button` props as well as a special `tooltip` prop. Pass any props you would pass to the `Tooltip` component to the `tooltip` prop and they'll get passed along for you to the wrapping tooltip.
