# Flyout

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Flyout` is a component to render a floating content modal. It is similar in purpose to a tooltip, but renders content of any sort, not only simple text.

## Usage

```jsx
import { Button, __experimentalFlyout as Flyout, __experimentalText as } from '@wordpress/components';

function Example() {
	return (
		<Flyout trigger={ <Button>Show/Hide content</Button> }>
			<Text>Code is Poetry</Text>
		</Flyout>
	);
}
```

## Props

TODO
