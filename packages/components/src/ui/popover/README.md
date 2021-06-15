# Popover

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Popover` is a component to render a floating content modal. It is similar in purpose to a tooltip, but renders content of any sort, not only simple text.

## Usage

```jsx
import { Button, Popover, View, Text } from '@wordpress/components/ui';

function Example() {
	return (
		<Popover trigger={ <Button>Popover</Button> }>
			<View>
				<Text>Code is Poetry</Text>
			</View>
		</Popover>
	);
}
```
