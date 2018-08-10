# ResponsiveToolbar

A wrapper that displays a resonsive toolbar. If there's enough space in the wrapper, the children elements are shown inline. If not, the elements move to a dropdown menu.

## Usage

```jsx
import { ResponsiveToolbar } from '@wordpress/components';

const MyResponsiveToolbar = () => (
	<ResponsiveToolbar>
	<IconButton icon="plus" />
		<Button>Long Button</Button>
		<IconButton icon="minus" />
		<div>
			<Button>Group1</Button>
			<Button>Group2</Button>
			<Button>Group3</Button>
		</div>
		<Button>Other Button</Button>
		<Button>Long Button</Button>
	</ResponsiveToolbar>
);
```
