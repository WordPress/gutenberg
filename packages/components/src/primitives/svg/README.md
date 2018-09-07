# SVG

A drop-in replacement for the svg element that adds the required accessibility attributes for SVG elements across browsers.

## Usage

```jsx
import { SVG } from '@wordpress/components';

const MyIcon = () => (
	<SVG
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path fill="none" d="M0 0h24v24H0V0z" />
		<g>
			<path d="M20 4v12H8V4h12m0-2H8L6 4v12l2 2h12l2-2V4l-2-2z" />
			<path d="M12 12l1 2 3-3 3 4H9z" />
			<path d="M2 6v14l2 2h14v-2H4V6H2z" />
		</g>
	</SVG>
	>
);
```
