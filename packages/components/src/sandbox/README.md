# Sandbox

This component provides an isolated environment for arbitrary HTML via iframes.

## Usage

```jsx
import { SandBox } from '@wordpress/components';

const MySandBox = () => (
	<SandBox
		html="<p>Content</p>"
		title="Sandbox"
		type="embed"
	/>
);
```
