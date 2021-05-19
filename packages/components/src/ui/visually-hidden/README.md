# VisuallyHidden

`VisuallyHidden` is a component used to render text intended to be visually hidden, but will show for alternate devices, for example a screen reader.

## Usage

```jsx
import { View, VisuallyHidden } from '@wordpress/components/ui';

function Example() {
	return (
		<VisuallyHidden>
			<View as="label">Code is Poetry</View>
		</VisuallyHidden>
	);
}
```
