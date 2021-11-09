# Tooltip

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Tooltip` is a component to render floating help text relative to a node when it receives focus or when the user places the mouse cursor atop it.

## Usage

```jsx
import { Tooltip, Text } from '@wordpress/components/ui';

function Example() {
	return (
		<Tooltip content="Code is Poetry">
			<Text>WordPress.org</Text>
		</Tooltip>
	);
}
```
