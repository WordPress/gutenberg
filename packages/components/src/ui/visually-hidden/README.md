# VisuallyHidden

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

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
