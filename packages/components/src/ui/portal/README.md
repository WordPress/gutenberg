# Portal

`Portal` is a layout helper that renders components at the root `document.body` level, outside the DOM hierarchy of the parent component.

## Usage

```jsx
import { Portal, View } from '@wordpress/components/ui';

function Example() {
	return (
		<Portal>
			<View>Code Is Poetry</View>
		</Portal>
	);
}
```
