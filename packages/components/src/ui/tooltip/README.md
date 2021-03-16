# Tooltip

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
